"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatTimeRange } from "@/lib/shifts-core";
import { approveShiftRequest, denyShiftRequest } from "@/app/admin/schedule/actions";

interface Item {
  id: string;
  kind: "claim" | "drop";
  employeeName: string;
  shift: { shift_date: string; start_time: string; end_time: string; role: string | null } | null;
}

function shiftLabel(s: Item["shift"]): string {
  if (!s) return "a shift";
  const day = new Date(`${s.shift_date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${day}, ${formatTimeRange(s.start_time, s.end_time)}${s.role ? ` · ${s.role}` : ""}`;
}

export default function ShiftRequestQueue({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [denying, setDenying] = useState<string | null>(null);
  const [note, setNote] = useState("");

  function run(fd: FormData, fn: (fd: FormData) => Promise<{ ok: boolean; error?: string; warning?: string }>) {
    setError(null);
    setFlash(null);
    start(async () => {
      const res = await fn(fd);
      if (res.ok) {
        if (res.warning) setFlash(res.warning);
        setDenying(null);
        setNote("");
        router.refresh();
      } else setError(res.error ?? "Something went wrong.");
    });
  }
  function approve(id: string) {
    const fd = new FormData();
    fd.set("request_id", id);
    run(fd, approveShiftRequest);
  }
  function deny(id: string) {
    const fd = new FormData();
    fd.set("request_id", id);
    fd.set("review_note", note);
    run(fd, denyShiftRequest);
  }

  if (items.length === 0) {
    return (
      <div className="card mt-3 text-sm text-[color:var(--brand-ink-muted)]">
        No pending shift requests.
      </div>
    );
  }

  return (
    <div className="card mt-3 p-0 overflow-hidden">
      <ul className="divide-y divide-[color:var(--brand-line)]">
        {items.map((r) => (
          <li key={r.id} className="p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold">
                  {r.employeeName}{" "}
                  <span className="font-normal text-[color:var(--brand-ink-muted)]">
                    wants to {r.kind === "claim" ? "pick up" : "drop"}
                  </span>
                </div>
                <div className="text-sm text-[color:var(--brand-ink-muted)]">{shiftLabel(r.shift)}</div>
              </div>
              {denying !== r.id ? (
                <div className="flex items-center gap-2">
                  <button className="btn-primary" onClick={() => approve(r.id)} disabled={pending}>
                    Approve
                  </button>
                  <button className="btn-ghost" onClick={() => { setDenying(r.id); setNote(""); }} disabled={pending}>
                    Deny
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <input className="input" placeholder="Reason (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                  <button className="btn-primary" onClick={() => deny(r.id)} disabled={pending}>
                    Confirm deny
                  </button>
                  <button className="btn-ghost" onClick={() => setDenying(null)}>Cancel</button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {flash && <div className="p-3 text-sm text-amber-800">{flash}</div>}
      {error && <div className="p-3 text-sm text-rose-600">{error}</div>}
    </div>
  );
}
