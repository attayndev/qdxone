"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatTimeRange } from "@/lib/shifts-core";
import { requestTimeOff, cancelTimeOff } from "@/app/staff/time-off/actions";

interface Req {
  id: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  status: "pending" | "approved" | "denied";
  review_note: string | null;
}

const STATUS_CLS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  denied: "bg-rose-100 text-rose-700",
};

function fmt(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function rangeLabel(r: Req) {
  const days = r.start_date === r.end_date ? fmt(r.start_date) : `${fmt(r.start_date)} – ${fmt(r.end_date)}`;
  return r.all_day ? days : `${days}, ${formatTimeRange(r.start_time ?? "", r.end_time ?? "")}`;
}

export default function TimeOffManager({ requests }: { requests: Req[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [st, setSt] = useState("09:00");
  const [en, setEn] = useState("17:00");
  const [reason, setReason] = useState("");

  function run(fd: FormData, fn: (fd: FormData) => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) {
    setError(null);
    start(async () => {
      const res = await fn(fd);
      if (res.ok) {
        onOk?.();
        router.refresh();
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  function submit() {
    if (!from) return setError("Pick a start date.");
    const fd = new FormData();
    fd.set("start_date", from);
    fd.set("end_date", to || from);
    fd.set("all_day", allDay ? "yes" : "no");
    fd.set("start_time", st);
    fd.set("end_time", en);
    fd.set("reason", reason);
    run(fd, requestTimeOff, () => { setFrom(""); setTo(""); setReason(""); });
  }

  function cancel(id: string) {
    const fd = new FormData();
    fd.set("request_id", id);
    run(fd, cancelTimeOff);
  }

  return (
    <div>
      {/* Request form */}
      <div className="card mt-4">
        <h2 className="font-extrabold">Request time off</h2>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="label">From</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
              <span className="text-sm">All day</span>
            </label>
          </div>
          {!allDay && (
            <>
              <div>
                <label className="label">From time</label>
                <input type="time" className="input" value={st} onChange={(e) => setSt(e.target.value)} />
              </div>
              <div>
                <label className="label">To time</label>
                <input type="time" className="input" value={en} onChange={(e) => setEn(e.target.value)} />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <label className="label">Reason (optional)</label>
            <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. vacation, appointment" />
          </div>
        </div>
        <button className="btn-primary mt-3" onClick={submit} disabled={pending || !from}>
          {pending ? "Submitting…" : "Submit request"}
        </button>
        {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
      </div>

      {/* Requests list */}
      <h2 className="text-lg font-black tracking-tight mt-6">Your requests</h2>
      <div className="card mt-2 p-0 overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-5 text-sm text-[color:var(--brand-ink-muted)]">No requests yet.</div>
        ) : (
          <ul className="divide-y divide-[color:var(--brand-line)]">
            {requests.map((r) => (
              <li key={r.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm">{rangeLabel(r)}</div>
                  {r.reason && <div className="text-xs text-[color:var(--brand-ink-muted)]">{r.reason}</div>}
                  {r.status === "denied" && r.review_note && (
                    <div className="text-xs text-rose-600 mt-0.5">Note: {r.review_note}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`chip ${STATUS_CLS[r.status]}`}>{r.status}</span>
                  {r.status === "pending" && (
                    <button className="text-xs text-rose-600 hover:underline" onClick={() => cancel(r.id)} disabled={pending}>
                      Cancel
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
