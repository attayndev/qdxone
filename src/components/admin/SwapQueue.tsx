"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatTimeRange } from "@/lib/shifts-core";
import { approveSwap, denySwap } from "@/app/admin/schedule/actions";
import type { SwapView, SwapShiftLite } from "@/lib/shift-swaps";

function shiftLabel(s: SwapShiftLite | null): string {
  if (!s) return "a removed shift";
  const day = new Date(`${s.shift_date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${day}, ${formatTimeRange(s.start_time, s.end_time)}${s.role ? ` · ${s.role}` : ""}`;
}

export default function SwapQueue({ items }: { items: SwapView[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function run(id: string, fn: (fd: FormData) => Promise<{ ok: boolean; error?: string; warning?: string }>) {
    setError(null);
    setFlash(null);
    const fd = new FormData();
    fd.set("swap_id", id);
    start(async () => {
      const res = await fn(fd);
      if (res.ok) {
        if (res.warning) setFlash(res.warning);
        router.refresh();
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  if (items.length === 0) {
    return (
      <div className="card mt-3 text-sm text-[color:var(--brand-ink-muted)]">
        No swaps awaiting approval.
      </div>
    );
  }

  return (
    <div className="card mt-3 p-0 overflow-hidden">
      <ul className="divide-y divide-[color:var(--brand-line)]">
        {items.map((sw) => (
          <li key={sw.id} className="p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm">
                <div className="font-semibold">
                  {sw.fromName} ⇄ {sw.toName}
                </div>
                <div className="text-[color:var(--brand-ink-muted)]">
                  {sw.fromName} gives <span className="font-medium">{shiftLabel(sw.fromShift)}</span> →{" "}
                  {sw.toName}
                </div>
                <div className="text-[color:var(--brand-ink-muted)]">
                  {sw.toName} gives <span className="font-medium">{shiftLabel(sw.toShift)}</span> →{" "}
                  {sw.fromName}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-primary" onClick={() => run(sw.id, approveSwap)} disabled={pending}>
                  Approve
                </button>
                <button className="btn-ghost" onClick={() => run(sw.id, denySwap)} disabled={pending}>
                  Deny
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {flash && <div className="p-3 text-sm text-amber-800">{flash}</div>}
      {error && <div className="p-3 text-sm text-rose-600">{error}</div>}
    </div>
  );
}
