"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WEEK_ORDER, formatTimeRange } from "@/lib/shifts-core";
import { addUnavailability, removeUnavailability } from "@/app/staff/availability/actions";

interface Block {
  id: string;
  day_of_week: number;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
}

export default function AvailabilityEditor({ blocks }: { blocks: Block[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Add-form state
  const [day, setDay] = useState(1); // Mon
  const [allDay, setAllDay] = useState(false);
  const [from, setFrom] = useState("09:00");
  const [to, setTo] = useState("15:00");
  const [note, setNote] = useState("");

  const byDay = new Map<number, Block[]>();
  for (const b of blocks) {
    if (!byDay.has(b.day_of_week)) byDay.set(b.day_of_week, []);
    byDay.get(b.day_of_week)!.push(b);
  }

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

  function add() {
    if (!allDay && from >= to) {
      setError("End time must be after start time.");
      return;
    }
    const fd = new FormData();
    fd.set("day_of_week", String(day));
    fd.set("all_day", allDay ? "yes" : "no");
    fd.set("start_time", from);
    fd.set("end_time", to);
    fd.set("note", note);
    run(fd, addUnavailability, () => setNote(""));
  }

  function remove(id: string) {
    const fd = new FormData();
    fd.set("block_id", id);
    run(fd, removeUnavailability);
  }

  return (
    <div>
      <div className="card mt-4 p-0 overflow-hidden">
        <ul className="divide-y divide-[color:var(--brand-line)]">
          {WEEK_ORDER.map(([dow, label]) => {
            const list = byDay.get(dow) ?? [];
            return (
              <li key={dow} className="p-3 flex items-start gap-3">
                <div className="w-12 font-bold text-sm pt-0.5">{label}</div>
                <div className="flex-1">
                  {list.length === 0 ? (
                    <span className="text-sm text-[color:var(--brand-ink-muted)]">Available</span>
                  ) : (
                    <ul className="space-y-1.5">
                      {list.map((b) => (
                        <li key={b.id} className="flex items-center justify-between gap-2">
                          <span className="text-sm">
                            <span className="chip bg-rose-100 text-rose-700 mr-2">Can&apos;t work</span>
                            {b.all_day ? "All day" : formatTimeRange(b.start_time ?? "", b.end_time ?? "")}
                            {b.note && <span className="text-[color:var(--brand-ink-muted)]"> · {b.note}</span>}
                          </span>
                          <button
                            className="text-xs text-rose-600 hover:underline"
                            onClick={() => remove(b.id)}
                            disabled={pending}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Add block */}
      <div className="card mt-4">
        <h2 className="font-extrabold">Block off a time</h2>
        <p className="text-sm text-[color:var(--brand-ink-muted)] mt-0.5">
          Add the times you <strong>can&apos;t</strong> work. Your manager sees these when building the schedule.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="label">Day</label>
            <select className="input" value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {WEEK_ORDER.map(([dow, label]) => (
                <option key={dow} value={dow}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">When</label>
            <label className="flex items-center gap-2 h-[46px]">
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
              <span className="text-sm">All day</span>
            </label>
          </div>
          {!allDay && (
            <>
              <div>
                <label className="label">From</label>
                <input type="time" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="label">To</label>
                <input type="time" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <label className="label">Reason (optional)</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. class, second job" />
          </div>
        </div>
        <button className="btn-primary mt-3" onClick={add} disabled={pending}>
          {pending ? "Saving…" : "Add"}
        </button>
        {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
      </div>
    </div>
  );
}
