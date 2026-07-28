"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondSwap, cancelSwap } from "@/app/staff/swaps/actions";
import { formatTimeRange } from "@/lib/shifts-core";
import type { SwapView, SwapShiftLite } from "@/lib/shift-swaps";

function shiftLabel(s: SwapShiftLite | null): string {
  if (!s) return "a removed shift";
  const day = new Date(`${s.shift_date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${day} ${formatTimeRange(s.start_time, s.end_time)}${s.role ? ` · ${s.role}` : ""}`;
}

const STATUS_CHIP: Record<string, string> = {
  proposed: "bg-amber-100 text-amber-800",
  accepted: "bg-indigo-100 text-indigo-800",
};

const STATUS_TEXT: Record<string, string> = {
  proposed: "Waiting on coworker",
  accepted: "Waiting on manager",
};

/** Employee's shift-swap inbox: incoming to answer, outgoing to track/cancel. */
export default function SwapsSection({
  incoming,
  outgoing,
}: {
  incoming: SwapView[];
  outgoing: SwapView[];
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fd: FormData, fn: (fd: FormData) => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn(fd);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Something went wrong.");
    });
  }

  if (incoming.length === 0 && outgoing.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-black tracking-tight">Shift swaps</h2>

      {incoming.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {incoming.map((sw) => (
            <div key={sw.id} className="card py-3">
              <div className="text-sm">
                <span className="font-semibold">{sw.fromName}</span> wants to take your{" "}
                <span className="font-semibold">{shiftLabel(sw.toShift)}</span> and give you their{" "}
                <span className="font-semibold">{shiftLabel(sw.fromShift)}</span>.
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("swap_id", sw.id);
                    fd.set("decision", "accept");
                    run(fd, respondSwap);
                  }}
                >
                  Accept
                </button>
                <button
                  className="btn-ghost"
                  disabled={busy}
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("swap_id", sw.id);
                    fd.set("decision", "decline");
                    run(fd, respondSwap);
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {outgoing.map((sw) => (
            <div key={sw.id} className="card py-3 flex items-center justify-between gap-3">
              <div className="text-sm">
                Your <span className="font-semibold">{shiftLabel(sw.fromShift)}</span> for{" "}
                <span className="font-semibold">{sw.toName}</span>&apos;s{" "}
                <span className="font-semibold">{shiftLabel(sw.toShift)}</span>
                <span className={`chip ml-2 ${STATUS_CHIP[sw.status] ?? "bg-gray-100 text-gray-700"}`}>
                  {STATUS_TEXT[sw.status] ?? sw.status}
                </span>
              </div>
              <button
                className="text-xs text-[color:var(--brand-ink-muted)] hover:underline shrink-0"
                disabled={busy}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("swap_id", sw.id);
                  run(fd, cancelSwap);
                }}
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
    </div>
  );
}
