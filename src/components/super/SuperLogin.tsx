"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { QdxWordmark } from "@/components/QdxLogo";

/**
 * Platform sign-in, rendered at /super when you're not (yet) an authenticated
 * admin. Self-contained — it establishes the session itself (Google OAuth, or an
 * emailed 6-digit code), then refreshes so the server re-renders the console. If
 * someone signs in who isn't a platform admin, we say so and offer sign-out.
 */
export function SuperLogin({ signedInEmail }: { signedInEmail: string | null }) {
  const router = useRouter();
  const [supa] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function google() {
    setError(null);
    setBusy(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=/super`;
    const { error } = await supa.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
    // else the browser navigates to Google.
  }

  async function sendCode() {
    setError(null);
    setBusy(true);
    const { error } = await supa.auth.signInWithOtp({ email: email.trim().toLowerCase() });
    setBusy(false);
    if (error) setError(error.message);
    else setStage("code");
  }

  async function verify() {
    setError(null);
    setBusy(true);
    const { error } = await supa.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh(); // session cookie now set → /super re-renders as the console
  }

  async function signOut() {
    await supa.auth.signOut();
    router.refresh();
  }

  return (
    <main className="min-h-screen grid place-items-center px-4 bg-[color:var(--brand-cream)]">
      <div className="w-full max-w-sm card">
        <QdxWordmark />
        <h1 className="text-xl font-black tracking-tight mt-4">Platform sign-in</h1>

        {signedInEmail ? (
          // Signed in, but not a platform admin.
          <>
            <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
              You&apos;re signed in as <strong>{signedInEmail}</strong>, which isn&apos;t a platform
              admin.
            </p>
            <button onClick={signOut} className="btn-primary w-full mt-4">
              Sign out
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">QDX staff only.</p>

            <button
              onClick={google}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-[color:var(--brand-line)] bg-white py-3 font-semibold hover:bg-[color:var(--brand-soft)] disabled:opacity-50 mt-4"
            >
              Continue with Google
            </button>

            <div className="flex items-center gap-3 text-xs text-[color:var(--brand-ink-muted)] my-4">
              <span className="h-px flex-1 bg-[color:var(--brand-line)]" />
              or
              <span className="h-px flex-1 bg-[color:var(--brand-line)]" />
            </div>

            {stage === "email" ? (
              <>
                <input
                  className="input w-full"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@qdx.one"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  onClick={sendCode}
                  disabled={busy || email.length < 4}
                  className="btn-primary w-full mt-3 disabled:opacity-50"
                >
                  {busy ? "Sending…" : "Email me a code"}
                </button>
              </>
            ) : (
              <>
                <input
                  className="input w-full"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  onClick={verify}
                  disabled={busy || code.length < 4}
                  className="btn-primary w-full mt-3 disabled:opacity-50"
                >
                  {busy ? "Verifying…" : "Sign in"}
                </button>
                <button
                  onClick={() => setStage("email")}
                  className="text-sm text-[color:var(--brand-ink-muted)] w-full text-center mt-3"
                >
                  Use a different email
                </button>
              </>
            )}
          </>
        )}

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>
    </main>
  );
}
