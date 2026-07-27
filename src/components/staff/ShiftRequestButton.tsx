"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimShift, dropShift, cancelShiftRequest } from "@/app/staff/shift-requests/actions";

/**
 * Pick-up / drop button for a shift. `pending` means the employee already has a
 * request of this kind in flight → shows a "cancel request" affordance instead.
 */
export default function ShiftRequestButton({
  shiftId,
  kind,
  pending,
}: {
  shiftId: string;
  kind: "claim" | "drop";
  pending: boolean;
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: (fd: FormData) => Promise<{ ok: boolean; error?: string }>, extra?: Record<string, string>) {
    setError(null);
    const fd = new FormData();
    fd.set("shift_id", shiftId);
    if (extra) for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    start(async () => {
      const res = await fn(fd);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Something went wrong.");
    });
  }

  if (pending) {
    return (
      <div className="text-right">
        <span className="chip bg-amber-100 text-amber-800 mr-2">
          {kind === "claim" ? "Requested" : "Drop pending"}
        </span>
        <button
          className="text-xs text-[color:var(--brand-ink-muted)] hover:underline"
          onClick={() => run(cancelShiftRequest, { kind })}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="text-right">
      <button
        className={kind === "claim" ? "btn-primary" : "btn-ghost"}
        onClick={() => run(kind === "claim" ? claimShift : dropShift)}
        disabled={busy}
      >
        {busy ? "…" : kind === "claim" ? "Pick up" : "Drop"}
      </button>
      {error && <div className="text-xs text-rose-600 mt-1">{error}</div>}
    </div>
  );
}
