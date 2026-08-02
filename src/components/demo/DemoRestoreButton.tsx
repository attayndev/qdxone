"use client";

import { useState, useTransition } from "react";

/** Demo-bar button: reload the demo to its canonical (frozen-snapshot) state. */
export function DemoRestoreButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run() {
    setMsg(null);
    start(async () => {
      try {
        const r = await fetch("/api/demo/restore", { method: "POST" });
        const j = (await r.json().catch(() => ({}))) as { ok?: boolean };
        if (j.ok) {
          setMsg("Restored");
          location.reload();
        } else {
          setMsg("Try again");
        }
      } catch {
        setMsg("Try again");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      title="Reset the demo to its canonical data"
      className="shrink-0 rounded-md border border-white/30 px-2.5 py-1 text-xs font-semibold hover:bg-white/10 disabled:opacity-60"
    >
      {pending ? "Restoring…" : msg ?? "↻ Restore demo"}
    </button>
  );
}
