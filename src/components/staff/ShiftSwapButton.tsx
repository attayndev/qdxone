"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { proposeSwap } from "@/app/staff/swaps/actions";
import { formatTimeRange } from "@/lib/shifts-core";
import type { SwapTarget } from "@/lib/shift-swaps";

function dayLabel(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * "Swap" action on one of my shifts: pick a coworker, then one of their shifts to
 * trade for. `pending` means this shift is already tied up in an in-flight swap.
 */
export default function ShiftSwapButton({
  fromShiftId,
  targets,
  pending,
}: {
  fromShiftId: string;
  targets: SwapTarget[];
  pending: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [coworker, setCoworker] = useState<string>("");
  const [toShiftId, setToShiftId] = useState<string>("");
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const target = useMemo(() => targets.find((t) => t.employeeId === coworker) ?? null, [targets, coworker]);

  function reset() {
    setOpen(false);
    setCoworker("");
    setToShiftId("");
    setError(null);
  }

  function submit() {
    if (!toShiftId) return;
    setError(null);
    const fd = new FormData();
    fd.set("from_shift_id", fromShiftId);
    fd.set("to_shift_id", toShiftId);
    start(async () => {
      const res = await proposeSwap(fd);
      if (res.ok) {
        reset();
        router.refresh();
      } else setError(res.error);
    });
  }

  if (pending) {
    return <span className="chip bg-indigo-100 text-indigo-800 whitespace-nowrap">Swap pending</span>;
  }

  return (
    <>
      <button
        className="text-xs font-semibold text-[color:var(--brand-blue-600)] hover:underline whitespace-nowrap"
        onClick={() => setOpen(true)}
        disabled={targets.length === 0}
        title={targets.length === 0 ? "No coworker shifts to trade for" : "Propose a shift trade"}
      >
        Swap
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" onClick={reset}>
          <div className="card w-full max-w-md max-h-[85vh] overflow-auto text-left" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-extrabold text-lg">Propose a trade</h2>
            <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
              Give up this shift for one of a coworker&apos;s. They accept, then your manager approves.
            </p>

            <label className="label mt-3">Coworker</label>
            <select
              className="input"
              value={coworker}
              onChange={(e) => {
                setCoworker(e.target.value);
                setToShiftId("");
              }}
            >
              <option value="">— choose —</option>
              {targets.map((t) => (
                <option key={t.employeeId} value={t.employeeId}>
                  {t.name}
                </option>
              ))}
            </select>

            {target && (
              <>
                <label className="label mt-3">Their shift to take</label>
                <ul className="mt-1 space-y-1.5">
                  {target.shifts.map((s) => (
                    <li key={s.id}>
                      <label className="card py-2 flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="to_shift"
                          checked={toShiftId === s.id}
                          onChange={() => setToShiftId(s.id)}
                        />
                        <span className="text-sm">
                          <span className="font-semibold">{dayLabel(s.shift_date)}</span>{" "}
                          {formatTimeRange(s.start_time, s.end_time)}
                          {s.role ? ` · ${s.role}` : ""}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
            <div className="flex items-center gap-2 mt-4">
              <button className="btn-primary" onClick={submit} disabled={busy || !toShiftId}>
                {busy ? "Proposing…" : "Propose trade"}
              </button>
              <button className="btn-ghost" onClick={reset}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
