"use client";

import { useEffect, useState } from "react";
import { captureDemoLead } from "@/app/demo/actions";

const SEEN_KEY = "qdx_demo_lead_seen";

/**
 * Pre-demo lead gate: a one-time pop-up (per browser) asking for an email before
 * exploring the demo. Fully optional — "Don't want to share" bypasses it. Shown
 * on every demo page but remembers the choice in localStorage so it only appears
 * once.
 */
export function DemoLeadGate() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setShow(true);
    } catch {
      /* private mode etc. — just don't gate */
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  async function submit() {
    setBusy(true);
    try {
      await captureDemoLead(email);
    } catch {
      /* best-effort */
    }
    setBusy(false);
    dismiss();
  }

  if (!show) return null;

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-black tracking-tight text-[color:var(--brand-ink)]">
          Take a look inside
        </h2>
        <p className="mt-1 text-sm text-[color:var(--brand-ink-muted)]">
          This is a live demo with sample candidates and real scores. Want us to follow up
          with pricing and help setting up your own? Drop your email — totally optional.
        </p>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && valid && submit()}
          placeholder="you@restaurant.com"
          className="mt-4 w-full rounded-xl border border-[color:var(--brand-line)] px-4 py-3 text-[color:var(--brand-ink)]"
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || !valid}
          className="btn-primary mt-3 w-full disabled:opacity-50"
        >
          {busy ? "One sec…" : "Show me the demo"}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="mt-3 w-full text-center text-sm text-[color:var(--brand-ink-muted)] hover:underline"
        >
          Don&apos;t want to share →
        </button>
      </div>
    </div>
  );
}
