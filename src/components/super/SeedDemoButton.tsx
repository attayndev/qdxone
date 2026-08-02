"use client";

import { useState, useTransition } from "react";
import { seedDemo } from "@/app/super/actions";
import { ROOT_DOMAIN } from "@/lib/host";

/** Rebuilds the demo org (clone of 16 Handles, PII scrubbed) on demand. */
export function SeedDemoButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run() {
    if (!confirm("Refresh the demo's frozen snapshot from live 16 Handles data (band-sampled, PII-scrubbed), then reload it? This updates the canonical demo data that every nightly reset restores.")) {
      return;
    }
    setMsg(null);
    start(async () => {
      const r = await seedDemo();
      setMsg(r.ok ? `✓ Demo rebuilt — ${r.candidates} candidates.` : `✗ ${r.error}`);
    });
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-lg border border-[color:var(--brand-line)] bg-white px-3 py-1.5 text-sm font-semibold hover:bg-[color:var(--brand-soft)] disabled:opacity-50"
      >
        {pending ? "Refreshing…" : "Refresh demo from live"}
      </button>
      <a
        href={`https://demo.${ROOT_DOMAIN}/admin`}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-semibold text-[color:var(--brand-blue-600)] hover:underline"
      >
        Open demo admin →
      </a>
      {msg && <span className="text-sm text-[color:var(--brand-ink-muted)]">{msg}</span>}
    </div>
  );
}
