import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { applySessionCookie, createSession } from "@/lib/auth";
import { insert, one, ready } from "@/lib/db";
import { readIntegrations } from "@/lib/secrets";
import { id, now, pageUrl } from "@/lib/utils";

export async function GET(req: Request) {
  await ready();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const saved = jar.get("aj_google")?.value;
  jar.set("aj_google", "", { path: "/", maxAge: 0 });
  if (!code || !state || !saved || state !== saved) {
    return NextResponse.redirect(pageUrl("/login?error=google"));
  }
  const cfg = readIntegrations();
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cfg.googleClientId,
      client_secret: cfg.googleClientSecret,
      redirect_uri: pageUrl("/api/auth/google/callback"),
      grant_type: "authorization_code",
    }),
  });
  const token = await tokenRes.json();
  if (!token.access_token) return NextResponse.redirect(pageUrl("/login?error=google"));
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { authorization: `Bearer ${token.access_token}` } });
  const profile = await profileRes.json();
  if (!profile.email || !profile.verified_email) return NextResponse.redirect(pageUrl("/login?error=google"));
  let user = await one<any>("SELECT * FROM users WHERE LOWER(email) = ? AND deleted_at IS NULL", [String(profile.email).toLowerCase()]);
  if (user && user.role !== "student") return NextResponse.redirect(pageUrl("/login?error=google"));
  if (user?.status === "suspended") return NextResponse.redirect(pageUrl("/login?error=suspended"));
  if (!user) {
    const userId = id();
    const stamp = now();
    await insert("users", {
      id: userId,
      email: String(profile.email).toLowerCase(),
      mobile: null,
      password_hash: null,
      full_name: profile.name || "AJ Classes Student",
      role: "student",
      status: "active",
      email_verified: 1,
      must_change_password: 0,
      google_sub: profile.id || null,
      avatar_url: profile.picture || null,
      created_at: stamp,
      updated_at: stamp,
      deleted_at: null,
    });
    await insert("student_profiles", { user_id: userId, preferred_course: null, city: null, bio: null });
    user = { id: userId };
  }
  const issued = await createSession(user.id, { userAgent: req.headers.get("user-agent") || "" });
  const redirect = NextResponse.redirect(pageUrl("/student/dashboard"));
  return applySessionCookie(redirect, issued.token);
}
