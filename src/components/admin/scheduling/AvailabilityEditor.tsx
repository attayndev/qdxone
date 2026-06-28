"use client";

import { useState, useTransition } from "react";
import { saveAvailability } from "@/app/admin/scheduling/actions";
import type { WeeklySchedule } from "@/lib/scheduling/availability-rules";

const DAYS: { dow: number; label: string }[] = [
  { dow: 1, label: "Monday" },
  { dow: 2, label: "Tuesday" },
  { dow: 3, label: "Wednesday" },
  { dow: 4, label: "Thursday" },
  { dow: 5, label: "Friday" },
  { dow: 6, label: "Saturday" },
  { dow: 0, label: "Sunday" },
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

interface DayState {
  enabled: boolean;
  start: string;
  end: string;
}

export default function AvailabilityEditor({ schedule }: { schedule: WeeklySchedule }) {
  const initial: Record<number, DayState> = {};
  for (const { dow } of DAYS) {
    const w = schedule.windows.find((x) => x.dayOfWeek === dow);
    initial[dow] = w
      ? { enabled: true, start: hhmm(w.startMinutes), end: hhmm(w.endMinutes) }
      : { enabled: false, start: "09:00", end: "17:00" };
  }
  const [days, setDays] = useState(initial);
  const [tz, setTz] = useState(
    TIMEZONES.includes(schedule.timezone) ? schedule.timezone : "America/New_York"
  );
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function setDay(dow: number, patch: Partial<DayState>) {
    setDays((d) => ({ ...d, [dow]: { ...d[dow], ...patch } }));
  }

  function onSubmit(formData: FormData) {
    setMsg(null);
    // Rebuild the fields from state (controlled), so disabled inputs still post.
    formData.set("timezone", tz);
    for (const { dow } of DAYS) {
      const d = days[dow];
      if (d.enabled) {
        formData.set(`enabled_${dow}`, "1");
        formData.set(`start_${dow}`, d.start);
        formData.set(`end_${dow}`, d.end);
      } else {
        formData.delete(`enabled_${dow}`);
      }
    }
    startTransition(async () => {
      const r = await saveAvailability(formData);
      setMsg(r.ok ? { kind: "ok", text: "Availability saved." } : { kind: "err", text: r.error });
    });
  }

  return (
    <form action={onSubmit} className="card space-y-4 max-w-2xl">
      <div>
        <label className="label">Time zone</label>
        <select className="input" value={tz} onChange={(e) => setTz(e.target.value)}>
          {TIMEZONES.map((z) => (
            <option key={z} value={z}>
              {z.replace("America/", "").replace("Pacific/", "").replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {DAYS.map(({ dow, label }) => {
          const d = days[dow];
          return (
            <div key={dow} className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 w-32 shrink-0">
                <input
                  type="checkbox"
                  checked={d.enabled}
                  onChange={(e) => setDay(dow, { enabled: e.target.checked })}
                />
                <span className={d.enabled ? "font-medium" : "text-[color:var(--brand-ink-muted)]"}>
                  {label}
                </span>
              </label>
              {d.enabled ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    className="input w-32"
                    value={d.start}
                    onChange={(e) => setDay(dow, { start: e.target.value })}
                  />
                  <span className="text-[color:var(--brand-ink-muted)]">to</span>
                  <input
                    type="time"
                    className="input w-32"
                    value={d.end}
                    onChange={(e) => setDay(dow, { end: e.target.value })}
                  />
                </div>
              ) : (
                <span className="text-sm text-[color:var(--brand-ink-muted)]">Unavailable</span>
              )}
            </div>
          );
        })}
      </div>

      {msg && (
        <p className={msg.kind === "ok" ? "text-green-700 text-sm" : "text-red-700 text-sm"}>
          {msg.text}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save availability"}
      </button>
    </form>
  );
}
