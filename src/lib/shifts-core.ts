/**
 * Pure scheduling helpers (no DB / no server-only imports, so unit-testable).
 * Times are "HH:MM[:SS]" strings, local to the store; dates are "YYYY-MM-DD".
 * A shift whose end_time ≤ start_time runs past midnight (overnight).
 */

export type ShiftStatus = "draft" | "published";

export interface ShiftRow {
  id: string;
  org_id: string;
  location_id: string;
  employee_id: string | null; // null = open shift
  role: string | null;
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  status: ShiftStatus;
  notes: string | null;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Minutes since midnight for a "HH:MM[:SS]" time. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m || 0);
}

/** "17:00:00" → "5:00pm", "09:30:00" → "9:30am". */
export function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const m = Number(mStr || 0);
  const ampm = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

/** "5:00pm – 11:00pm" style range. */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

/** Whether a shift crosses midnight (end at/or before start). */
export function isOvernight(startTime: string, endTime: string): boolean {
  return timeToMinutes(endTime) <= timeToMinutes(startTime);
}

/** Shift length in hours, counting an overnight shift into the next day. */
export function shiftHours(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  if (end <= start) end += 24 * 60; // overnight
  return (end - start) / 60;
}

/** Do two same-employee shifts on the same date overlap in time? */
export function shiftsOverlap(
  a: { start_time: string; end_time: string },
  b: { start_time: string; end_time: string }
): boolean {
  const s1 = timeToMinutes(a.start_time);
  const e1 = isOvernight(a.start_time, a.end_time)
    ? timeToMinutes(a.end_time) + 1440
    : timeToMinutes(a.end_time);
  const s2 = timeToMinutes(b.start_time);
  const e2 = isOvernight(b.start_time, b.end_time)
    ? timeToMinutes(b.end_time) + 1440
    : timeToMinutes(b.end_time);
  return s1 < e2 && s2 < e1;
}

// ── Weekday + availability (block-off) helpers ──────────────────────────────

/** Weekday labels indexed by getUTCDay (0=Sun … 6=Sat). */
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
/** Days in schedule order (Mon-first) as [index, label]. */
export const WEEK_ORDER: Array<[number, string]> = [
  [1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"],
];

/** Day-of-week (0=Sun … 6=Sat) for a YYYY-MM-DD date. */
export function dayOfWeek(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

export interface UnavailBlock {
  day_of_week: number;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
}

/** Does a shift fall within any of the employee's block-off (unavailable) times? */
export function shiftHitsUnavailability(
  shift: { shift_date: string; start_time: string; end_time: string },
  blocks: UnavailBlock[]
): boolean {
  const dow = dayOfWeek(shift.shift_date);
  return blocks.some((b) => {
    if (b.day_of_week !== dow) return false;
    if (b.all_day) return true;
    if (!b.start_time || !b.end_time) return false;
    return shiftsOverlap(
      { start_time: shift.start_time, end_time: shift.end_time },
      { start_time: b.start_time, end_time: b.end_time }
    );
  });
}

// ── Week helpers (weeks run Monday→Sunday, UTC math to avoid DST drift) ──────

/** Add whole days to a YYYY-MM-DD date, returning YYYY-MM-DD (UTC). */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The Monday of the week containing `dateStr` (YYYY-MM-DD, UTC). */
export function weekStart(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  const offset = (dow + 6) % 7; // days since Monday
  return addDays(dateStr, -offset);
}

/** The 7 dates (Mon→Sun) of the week containing `dateStr`. */
export function weekDates(dateStr: string): string[] {
  const mon = weekStart(dateStr);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

/** Does a published shift have edits since it was last published (or is a draft)? */
export function hasUnpublishedChanges(s: {
  status: ShiftStatus;
  published_at: string | null;
  updated_at: string;
}): boolean {
  if (s.status !== "published" || !s.published_at) return true;
  return new Date(s.updated_at).getTime() > new Date(s.published_at).getTime() + 1000;
}

/**
 * Duplicate a set of shifts forward by `weeks` (default 1), as drafts with
 * fresh identity — the "copy last week" builder step. Returns plain insert
 * payloads (no id/status/timestamps); caller stamps org/status.
 */
export function copyWeekShifts<T extends ShiftRow>(
  shifts: T[],
  weeks = 1
): Array<Pick<ShiftRow, "location_id" | "employee_id" | "role" | "shift_date" | "start_time" | "end_time" | "notes">> {
  const dayShift = weeks * 7;
  return shifts.map((s) => ({
    location_id: s.location_id,
    employee_id: s.employee_id,
    role: s.role,
    shift_date: addDays(s.shift_date, dayShift),
    start_time: s.start_time,
    end_time: s.end_time,
    notes: s.notes,
  }));
}

/** Total scheduled hours per employee id (open shifts keyed under "open"). */
export function hoursByEmployee(shifts: ShiftRow[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of shifts) {
    const key = s.employee_id ?? "open";
    out.set(key, (out.get(key) ?? 0) + shiftHours(s.start_time, s.end_time));
  }
  return out;
}

/** Total scheduled hours per date (YYYY-MM-DD → hours). */
export function hoursByDay(shifts: ShiftRow[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of shifts) {
    out.set(s.shift_date, (out.get(s.shift_date) ?? 0) + shiftHours(s.start_time, s.end_time));
  }
  return out;
}
