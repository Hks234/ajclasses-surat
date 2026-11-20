"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

async function post(action: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/auth/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Request failed");
  return data as Record<string, any>;
}

export function LoginForm({ portal = "student" }: { portal?: "student" | "admin" }) {
  const params = useSearchParams();
  const [error, setError] = useState(params.get("error") === "google" ? "Google sign-in could not be completed." : "");
  const [pending, setPending] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = await post("login", { email: form.get("email"), password: form.get("password"), portal });
      const next = params.get("next") || "/student/dashboard";
      const target = data.mustChangePassword && portal === "admin" ? "/admin/security" : portal === "admin" ? "/admin/dashboard" : next;
      window.location.assign(target);
      return;
    } catch (err) { setError(err instanceof Error ? err.message : "Login failed"); }
    setPending(false);
  }
  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      {portal === "student" ? <p className="text-sm text-slate-600">Student login uses your email and password. Create an account if you do not have one yet.</p> : null}
      <label className="block"><span className="label">Email</span><input name="email" type="email" autoComplete="email" required className="field" /></label>
      <label className="block"><span className="label">Password</span><input name="password" type="password" autoComplete="current-password" required className="field" /></label>
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      <button className="btn-orange w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in with email"}</button>
      <div className="flex justify-between text-sm font-semibold"><Link href="/forgot-password">Forgot password</Link>{portal === "student" ? <Link href="/register">Create account</Link> : null}</div>
    </form>
  );
}

export function RegisterForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const data = await post("register", { fullName: form.get("fullName"), email: form.get("email"), mobile: form.get("mobile"), password: form.get("password"), confirm: form.get("confirm") });
      setMessage(data.ready ? "Account created. Sign in with this email and password." : "Account created. Check your email to verify it, then sign in with this email and password.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not register"); }
  }
  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <label className="block"><span className="label">Full name</span><input name="fullName" required className="field" /></label>
      <label className="block"><span className="label">Email</span><input name="email" type="email" required className="field" /></label>
      <label className="block"><span className="label">Mobile</span><input name="mobile" required className="field" /></label>
      <label className="block"><span className="label">Password</span><input name="password" type="password" required className="field" /></label>
      <label className="block"><span className="label">Confirm password</span><input name="confirm" type="password" required className="field" /></label>
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      {message ? <p className="text-sm font-semibold text-navy break-all">{message}</p> : null}
      <button className="btn-orange w-full">Create account</button>
    </form>
  );
}

export function ForgotForm() {
  const [message, setMessage] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = await post("forgot", { email: form.get("email") });
    setMessage(data.devLink ? `Reset link (email is not configured): ${data.devLink}` : "If the account exists, a reset link has been sent.");
  }
  return <form onSubmit={onSubmit} className="card space-y-4 p-6"><input name="email" type="email" required className="field" placeholder="Email" /><button className="btn-orange">Send reset link</button>{message ? <p className="text-sm font-semibold break-all">{message}</p> : null}</form>;
}

export function ResetForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") || "");
    try { await post("reset", { token, password }); setMessage("Password updated. You can sign in."); } catch (err) { setError(err instanceof Error ? err.message : "Reset failed"); }
  }
  return <form onSubmit={onSubmit} className="card space-y-4 p-6"><input name="password" type="password" required className="field" placeholder="New password" /><button className="btn-orange">Save password</button>{error ? <p className="text-sm text-red-700">{error}</p> : null}{message ? <p className="text-sm font-semibold">{message}</p> : null}</form>;
}

export function VerifyClient({ token }: { token: string }) {
  const [message, setMessage] = useState(token ? "Verifying…" : "Open the verification link from your email.");
  useEffect(() => {
    if (!token) return;
    post("verify", { token }).then(() => setMessage("Email verified. You can sign in.")).catch((err) => setMessage(err.message));
  }, [token]);
  return <p className="card p-6 font-semibold">{message}</p>;
}

export function ResetPageClient() {
  const token = useSearchParams().get("token") || "";
  return <ResetForm token={token} />;
}

export function VerifyPageClient() {
  return <VerifyClient token={useSearchParams().get("token") || ""} />;
}
