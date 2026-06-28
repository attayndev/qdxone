/**
 * Pure availability engine. Computes bookable interview slots for one day as the
 * intersection of: the interviewer's weekly availability rules, date-specific
 * overrides, the template's duration/buffers/min-notice/max-horizon, and busy
 * periods (calendar conflicts + existing QDX bookings). No DB, no I/O —
 * everything is passed in, so it's fully unit-testable.
 *
 * Algorithm adapted from CloudMeet (MIT, see THIRD_PARTY_NOTICES.md), re-extracted
 * as a pure function and extended with buffers, configurable min-notice, a max
 * booking horizon, override handling, and DST-safe timezone conversion (CloudMeet's
 * inline version had none of these).
 *
 * All instants are UTC `Date`s; wall-clock inputs carry their IANA timezone.
 */

import type { BusyPeriod } from "@/lib/calendar-providers/provider";
import { mergeBusy } from "@/lib/calendar-providers/provider";

export interface WorkingWindow {
  /** Minutes from local midnight, e.g. 540 = 09:00. */
  startMinutes: number;
  endMinutes: number;
}

export interface DayAvailabilityRule {
  dayOfWeek: number; // 0=Sun..6=Sat
  startMinutes: number;
  endMinutes: number;
  timezone: string; // IANA, e.g. "America/New_York"
}

export interface DayOverride {
  /** ISO date "YYYY-MM-DD" (in the interviewer's tz). */
  date: string;
  isUnavailable: boolean;
  startMinutes?: number;
  endMinutes?: number;
}

export interface Slot {
  start: Date;
  end: Date;
}

export interface ComputeSlotsInput {
  /** The local calendar date to compute, "YYYY-MM-DD" in `timezone`. */
  date: string;
  timezone: string;
  rules: DayAvailabilityRule[];
  overrides: DayOverride[];
  busy: BusyPeriod[];
  durationMinutes: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  minNoticeMinutes?: number;
  maxAdvanceDays?: number;
  /** Step between candidate slot starts; defaults to min(30, duration). */
  slotIncrementMinutes?: number;
  /** "Now" — injected for testability. */
  now: Date;
}

// ── Timezone-safe conversion ───────────────────────────────────────────────

/** Offset (ms) of `tz` at `instant`: wallClock(tz) − UTC. */
function tzOffsetMs(instant: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const p: Record<string, number> = {};
  for (const part of dtf.formatToParts(instant)) {
    if (part.type !== "literal") p[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
  return asUtc - instant.getTime();
}

/** The UTC instant whose wall-clock time in `tz` is the given Y-M-D H:M. */
function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  minutes: number,
  tz: string
): Date {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  // Two-pass: correct for the offset, then re-check across a DST boundary.
  const off1 = tzOffsetMs(new Date(guess), tz);
  let utc = guess - off1;
  const off2 = tzOffsetMs(new Date(utc), tz);
  if (off2 !== off1) utc = guess - off2;
  return new Date(utc);
}

function parseDate(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

/** Day-of-week (0=Sun) for a calendar date — independent of the runner's tz. */
function weekday(date: string): number {
  const { y, m, d } = parseDate(date);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// ── The engine ─────────────────────────────────────────────────────────────

export function computeSlots(input: ComputeSlotsInput): Slot[] {
  const {
    date,
    timezone,
    rules,
    overrides,
    durationMinutes,
    now,
  } = input;
  const bufferBefore = input.bufferBeforeMinutes ?? 0;
  const bufferAfter = input.bufferAfterMinutes ?? 0;
  const minNotice = input.minNoticeMinutes ?? 0;
  const maxAdvanceDays = input.maxAdvanceDays ?? 365;
  const step = input.slotIncrementMinutes ?? Math.min(30, durationMinutes);
  const { y, m, d } = parseDate(date);

  // 1) Effective working windows (local minutes) for this date.
  const override = overrides.find((o) => o.date === date);
  let windows: WorkingWindow[] = [];
  if (override) {
    if (override.isUnavailable && override.startMinutes == null) {
      return []; // whole-day blackout
    }
    if (override.startMinutes != null && override.endMinutes != null) {
      windows = [{ startMinutes: override.startMinutes, endMinutes: override.endMinutes }];
    }
  }
  if (windows.length === 0) {
    const dow = weekday(date);
    windows = rules
      .filter((r) => r.dayOfWeek === dow && r.timezone === timezone)
      .map((r) => ({ startMinutes: r.startMinutes, endMinutes: r.endMinutes }));
  }
  if (windows.length === 0) return [];

  const busy = mergeBusy(input.busy);
  const minStart = now.getTime() + minNotice * 60_000;
  const maxStart = now.getTime() + maxAdvanceDays * 86_400_000;

  const slots: Slot[] = [];
  for (const w of windows) {
    for (let t = w.startMinutes; t + durationMinutes <= w.endMinutes; t += step) {
      const start = zonedTimeToUtc(y, m, d, t, timezone);
      const end = new Date(start.getTime() + durationMinutes * 60_000);

      if (start.getTime() < minStart) continue; // min notice (also drops the past)
      if (start.getTime() > maxStart) continue; // booking horizon

      // Buffer-padded block must not collide with any busy period.
      const blockStart = start.getTime() - bufferBefore * 60_000;
      const blockEnd = end.getTime() + bufferAfter * 60_000;
      const clash = busy.some(
        (b) => b.start.getTime() < blockEnd && b.end.getTime() > blockStart
      );
      if (clash) continue;

      slots.push({ start, end });
    }
  }
  return slots;
}
