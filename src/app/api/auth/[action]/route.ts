import { cookies } from "next/headers";
import { applySessionCookie, clearSession, clearSessionCookie, checkPassword, createSession, getSession, hashPassword, loginBlocked, recordLogin } from "@/lib/auth";
import { all, insert, one, ready, run } from "@/lib/db";
import { queueTemplate } from "@/lib/email";
import { bad, json, originBlock } from "@/lib/http";
import { readIntegrations } from "@/lib/secrets";
import { id, normalizeMobile, now, pageUrl, passwordOk, randomToken, sha256, validMobile, clientIp } from "@/lib/utils";
import { z } from "zod";

async function userByEmail(email: string) {
  return one<any>("SELECT * FROM users WHERE LOWER(email) = ? AND deleted_at IS NULL", [email.toLowerCase()]);
}

export async function POST(req: Request, ctx: { params: Promise<{ action: string }> }) {
  const blocked = originBlock(req);
  if (blocked) return blocked;
  await ready();
  const { action } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const ip = clientIp(req);

  if (action === "register") {
    const parsed = z.object({
      fullName: z.string().min(3),
      email: z.string().email(),
      mobile: z.string().min(10),
      password: z.string().min(10),
      confirm: z.string(),
    }).safeParse(body);
    if (!parsed.success) return bad("Check the registration fields.");
    if (parsed.data.password !== parsed.data.confirm) return bad("Passwords do not match.");
    if (!passwordOk(parsed.data.password)) return bad("Use 10 or more characters with upper case, lower case and a number.");
    if (!validMobile(parsed.data.mobile)) return bad("Enter a valid 10-digit Indian mobile number.");
    const email = parsed.data.email.toLowerCase();
    if (await userByEmail(email)) return bad("An account with this email already exists.", 409);
    const userId = id();
    const stamp = now();
    const mailReady = Boolean(readIntegrations().smtpHost);
    await insert("users", {
      id: userId,
      email,
      mobile: normalizeMobile(parsed.data.mobile),
      password_hash: await hashPassword(parsed.data.password),
      full_name: parsed.data.fullName.trim(),
      role: "student",
      status: "active",
      email_verified: mailReady ? 0 : 1,
      must_change_password: 0,
      google_sub: null,
      avatar_url: null,
      created_at: stamp,
      updated_at: stamp,
      deleted_at: null,
    });
    await insert("student_profiles", { user_id: userId, preferred_course: null, city: null, bio: null });
    if (mailReady) {
      const token = randomToken();
      await insert("email_verification_tokens", { id: id(), user_id: userId, token_hash: sha256(token), expires_at: new Date(Date.now() + 86400000).toISOString(), used_at: null });
      await queueTemplate("verify_email", email, { student_name: parsed.data.fullName, verify_link: pageUrl(`/verify-email?token=${token}`) });
    }
    return json({ ok: true, devLink: "", ready: !mailReady });
  }

  if (action === "login") {
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const portal = body.portal === "admin" ? "admin" : "student";
    if (await loginBlocked(email)) return bad("Too many attempts. Try again in 15 minutes.", 429);
    const user = await userByEmail(email);
    const match = user ? await checkPassword(password, user.password_hash || "") : false;
    if (!user || user.role !== portal) {
      await recordLogin(email, ip, false);
      return bad("Email or password is incorrect.", 401);
    }
    if (!user.password_hash) {
      await recordLogin(email, ip, false);
      return bad("This email does not have a password yet. Use Forgot password to set one, then sign in with your email.", 401);
    }
    if (!match) {
      await recordLogin(email, ip, false);
      return bad("Email or password is incorrect.", 401);
    }
    if (user.status === "suspended") return bad("This account is suspended.", 403);
    if (!user.email_verified) {
      if (readIntegrations().smtpHost) return bad("Verify this email before signing in. Open the link sent by AJ Classes.", 403);
      await run("UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?", [now(), user.id]);
    }
    await recordLogin(email, ip, true);
    const issued = await createSession(user.id, { ip, userAgent: req.headers.get("user-agent") || "" });
    if (user.role === "admin") await run("UPDATE admin_users SET last_login_at = ? WHERE user_id = ?", [now(), user.id]);
    return applySessionCookie(json({ ok: true, role: user.role, mustChangePassword: Boolean(user.must_change_password) }), issued.token);
  }

  if (action === "logout") {
    await clearSession();
    return clearSessionCookie(json({ ok: true }));
  }

  if (action === "resend") {
    const user = await userByEmail(String(body.email || ""));
    if (!user || user.email_verified) return json({ ok: true });
    const token = randomToken();
    await insert("email_verification_tokens", { id: id(), user_id: user.id, token_hash: sha256(token), expires_at: new Date(Date.now() + 86400000).toISOString(), used_at: null });
    await queueTemplate("verify_email", user.email, { student_name: user.full_name, verify_link: pageUrl(`/verify-email?token=${token}`) });
    const devLink = process.env.NODE_ENV !== "production" && !readIntegrations().smtpHost ? pageUrl(`/verify-email?token=${token}`) : "";
    return json({ ok: true, devLink });
  }

  if (action === "verify") {
    const token = String(body.token || "");
    const row = await one<any>("SELECT * FROM email_verification_tokens WHERE token_hash = ? AND used_at IS NULL", [sha256(token)]);
    if (!row || row.expires_at < now()) return bad("This verification link is invalid or expired.");
    await run("UPDATE email_verification_tokens SET used_at = ? WHERE id = ?", [now(), row.id]);
    await run("UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?", [now(), row.user_id]);
    return json({ ok: true });
  }

  if (action === "forgot") {
    const user = await userByEmail(String(body.email || ""));
    let devLink = "";
    if (user && user.password_hash) {
      const token = randomToken();
      await insert("password_reset_tokens", { id: id(), user_id: user.id, token_hash: sha256(token), expires_at: new Date(Date.now() + 3600000).toISOString(), used_at: null });
      await queueTemplate("password_reset", user.email, { student_name: user.full_name, reset_link: pageUrl(`/reset-password?token=${token}`) });
      if (process.env.NODE_ENV !== "production" && !readIntegrations().smtpHost) devLink = pageUrl(`/reset-password?token=${token}`);
    }
    return json({ ok: true, devLink });
  }

  if (action === "reset") {
    const token = String(body.token || "");
    const password = String(body.password || "");
    if (!passwordOk(password)) return bad("Use 10 or more characters with upper case, lower case and a number.");
    const row = await one<any>("SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL", [sha256(token)]);
    if (!row || row.expires_at < now()) return bad("This reset link is invalid or expired.");
    await run("UPDATE password_reset_tokens SET used_at = ? WHERE id = ?", [now(), row.id]);
    await run("UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?", [await hashPassword(password), now(), row.user_id]);
    await run("DELETE FROM sessions WHERE user_id = ?", [row.user_id]);
    return json({ ok: true });
  }

  if (action === "password") {
    const session = await getSession();
    if (!session) return bad("Sign in required.", 401);
    const current = String(body.current || "");
    const password = String(body.password || "");
    const user = await one<any>("SELECT * FROM users WHERE id = ?", [session.id]);
    if (!user || !(await checkPassword(current, user.password_hash || ""))) return bad("Current password is incorrect.");
    if (!passwordOk(password)) return bad("Use 10 or more characters with upper case, lower case and a number.");
    await run("UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?", [await hashPassword(password), now(), session.id]);
    return json({ ok: true });
  }

  if (action === "google") {
    const cfg = readIntegrations();
    if (!cfg.googleClientId || !cfg.googleClientSecret) return bad("Google sign-in is not configured yet.", 503);
    const state = randomToken(16);
    const jar = await cookies();
    jar.set("aj_google", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", cfg.googleClientId);
    url.searchParams.set("redirect_uri", pageUrl("/api/auth/google/callback"));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");
    return json({ url: url.toString() });
  }

  return bad("Unknown action.", 404);
}

export async function GET() {
  await ready();
  const session = await getSession();
  if (!session) return json({ user: null });
  return json({
    user: {
      id: session.id,
      email: session.email,
      fullName: session.fullName,
      role: session.role,
      emailVerified: session.emailVerified,
      mustChangePassword: session.mustChangePassword,
      avatarUrl: session.avatarUrl,
      adminRole: session.adminRole,
      permissions: session.permissions,
    },
  });
}

void all;
