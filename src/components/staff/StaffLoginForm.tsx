"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Mode = "signin" | "reset";

export default function StaffLoginForm({ appleEnabled }: { appleEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function oauth(provider: "google" | "apple") {
    setError(null);
    try {
      const supa = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/staff")}`;
      const { error } = await supa.auth.signInWithOAuth({ provider, options: { redirectTo } });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start sign-in.");
    }
  }

  async function post(action: string, payload: Record<string, string>) {
    const res = await fetch("/api/staff-auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    return { ok: res.ok, body: await res.json().catch(() => ({}) as { error?: string }) };
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { ok, body } = await post("password", { email, password });
    if (ok) {
      window.location.href = "/staff";
      return;
    }
    setError(body?.error || "Unable to sign in.");
    setPending(false);
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    await post("reset", { email });
    setSent(true);
    setPending(false);
  }

  if (sent) {
    return (
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">✓</div>
        <h2 className="font-extrabold text-lg">Check your inbox</h2>
        <p className="text-sm text-[color:var(--brand-ink-muted)]">
          If <span className="font-semibold">{email}</span> is on your team&apos;s roster, a link to
          set your password is on its way. It may land in spam.
        </p>
        <button className="text-xs text-[color:var(--brand-ink-muted)] hover:underline mt-2" onClick={() => { setSent(false); setMode("signin"); }}>
          ← Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => oauth("google")} disabled={pending}
        className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-[color:var(--brand-line)] bg-white py-3 font-semibold hover:bg-[color:var(--brand-soft)] disabled:opacity-50">
        <GoogleG /> Continue with Google
      </button>
      {appleEnabled && (
        <button type="button" onClick={() => oauth("apple")} disabled={pending}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-[color:var(--brand-line)] bg-black text-white py-3 font-semibold hover:bg-black/90 disabled:opacity-50">
          <AppleLogo /> Continue with Apple
        </button>
      )}

      <div className="flex items-center gap-3 text-xs text-[color:var(--brand-ink-muted)]">
        <span className="h-px flex-1 bg-[color:var(--brand-line)]" /> or <span className="h-px flex-1 bg-[color:var(--brand-line)]" />
      </div>

      {mode === "signin" ? (
        <form onSubmit={signIn} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={pending || !email || !password} className="btn-primary w-full">
            {pending ? "Signing in…" : "Sign in"}
          </button>
          <button type="button" className="text-xs text-[color:var(--brand-ink-muted)] hover:underline" onClick={() => { setMode("reset"); setError(null); }}>
            First time here, or forgot your password? Set it →
          </button>
        </form>
      ) : (
        <form onSubmit={sendReset} className="space-y-3">
          <p className="text-sm text-[color:var(--brand-ink-muted)]">
            Enter your email and we&apos;ll send a link to set your password.
          </p>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" disabled={pending || !email} className="btn-primary w-full">
            {pending ? "Sending…" : "Send set-password link"}
          </button>
          <button type="button" className="text-xs text-[color:var(--brand-ink-muted)] hover:underline" onClick={() => { setMode("signin"); setError(null); }}>
            ← Back to sign in
          </button>
        </form>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden="true">
      <path d="M13.3 9.6c0-2 1.6-3 1.7-3-.9-1.4-2.4-1.5-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.2 2-1.4 2.4-.4 6 1 8 .6 1 1.4 2 2.4 2 1 0 1.3-.6 2.5-.6s1.5.6 2.5.6 1.7-.9 2.3-1.9c.7-1.1 1-2.2 1-2.2s-1.9-.7-1.9-2.8zM11.2 3.3c.5-.7.9-1.6.8-2.5-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.4.9.1 1.8-.4 2.3-1.1z" />
    </svg>
  );
}
