"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatTimeRange } from "@/lib/shifts-core";
import { approveTimeOff, denyTimeOff } from "@/app/admin/schedule/actions";

interface Item {
  id: string;
  employeeName: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

function fmt(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function rangeLabel(r: Item) {
  const days = r.start_date === r.end_date ? fmt(r.start_date) : `${fmt(r.start_date)} – ${fmt(r.end_date)}`;
  return r.all_day ? days : `${days}, ${formatTimeRange(r.start_time ?? "", r.end_time ?? "")}`;
}

export default function TimeOffQueue({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [denying, setDenying] = useState<string | null>(null);
  const [note, setNote] = useState("");

  function run(fd: FormData, fn: (fd: FormData) => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn(fd);
      if (res.ok) {
        setDenying(null);
        setNote("");
        router.refresh();
      } else setError(res.error ?? "Something went wrong.");
    });
  }
  function approve(id: string) {
    const fd = new FormData();
    fd.set("request_id", id);
    run(fd, approveTimeOff);
  }
  function deny(id: string) {
    const fd = new FormData();
    fd.set("request_id", id);
    fd.set("review_note", note);
    run(fd, denyTimeOff);
  }

  if (items.length === 0) {
    return (
      <div className="card mt-4 text-sm text-[color:var(--brand-ink-muted)]">
        No pending time-off requests.
      </div>
    );
  }

  return (
    <div className="card mt-4 p-0 overflow-hidden">
      <ul className="divide-y divide-[color:var(--brand-line)]">
        {items.map((r) => (
          <li key={r.id} className="p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold">{r.employeeName}</div>
                <div className="text-sm text-[color:var(--brand-ink-muted)]">
                  {rangeLabel(r)}
                  {r.reason ? ` · ${r.reason}` : ""}
                </div>
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
                  <input
                    className="input"
                    placeholder="Reason (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <button className="btn-primary" onClick={() => deny(r.id)} disabled={pending}>
                    Confirm deny
                  </button>
                  <button className="btn-ghost" onClick={() => setDenying(null)}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {error && <div className="p-3 text-sm text-rose-600">{error}</div>}
    </div>
  );
}
