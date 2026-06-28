/**
 * Available-slots service. Composes the pure availability engine (computeSlots)
 * with the interviewer's stored weekly rules + date overrides and their LIVE
 * calendar free/busy (Google), over the template's booking horizon. Returns
 * slots grouped by local date, ready for the public booking page.
 *
 * If the interviewer has no calendar connection (or the busy fetch fails), we
 * fall back to availability-only — better to offer times than to show nothing;
 * the booking still re-checks against the DB exclusion constraint at write time.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { computeSlots, type DayAvailabilityRule, type DayOverride } from "./availability";
import { getWeeklySchedule, timeToMinutes } from "./availability-rules";
import { getFreshAccessToken } from "./connections";
import { googleProvider } from "@/lib/calendar-providers/google";
import type { BusyPeriod } from "@/lib/calendar-providers/provider";

export interface DaySlots {
  date: string; // YYYY-MM-DD (interviewer-local)
  label: string; // e.g. "Mon, Jun 30"
  slots: { startIso: string; endIso: string; label: string }[];
}

interface SlotTemplate {
  durationMinutes: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
}

/** Calendar dates "YYYY-MM-DD" in `tz`, starting today, for `days` days. */
function localDates(tz: string, days: number, now: Date): string[] {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = fmt.format(now).split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    out.push(
      `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(
        dt.getUTCDate()
      ).padStart(2, "0")}`
    );
  }
  return out;
}

export async function getAvailableSlots(
  orgId: string,
  interviewerId: string,
  template: SlotTemplate,
  now: Date = new Date()
): Promise<DaySlots[]> {
  const schedule = await getWeeklySchedule(orgId, interviewerId);
  if (schedule.windows.length === 0) return [];
  const tz = schedule.timezone;

  const rules: DayAvailabilityRule[] = schedule.windows.map((w) => ({
    dayOfWeek: w.dayOfWeek,
    startMinutes: w.startMinutes,
    endMinutes: w.endMinutes,
    timezone: tz,
  }));

  // Date-specific overrides (no UI yet, but honored if present).
  const { data: ovr } = await adminClient()
    .from("availability_overrides")
    .select("date, start_time, end_time, is_unavailable")
    .eq("org_id", orgId)
    .eq("user_id", interviewerId);
  const overrides: DayOverride[] = (
    (ovr as
      | { date: string; start_time: string | null; end_time: string | null; is_unavailable: boolean }[]
      | null) ?? []
  ).map((o) => ({
    date: o.date,
    isUnavailable: o.is_unavailable,
    startMinutes: o.start_time ? timeToMinutes(o.start_time) : undefined,
    endMinutes: o.end_time ? timeToMinutes(o.end_time) : undefined,
  }));

  const horizonDays = Math.min(template.maxAdvanceDays + 1, 90);
  const windowEnd = new Date(now.getTime() + horizonDays * 86_400_000);

  // Live busy: calendar conflicts + already-booked interview slots.
  const busy = await getBusy(orgId, interviewerId, now, windowEnd);

  const dateFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  });

  const out: DaySlots[] = [];
  for (const date of localDates(tz, horizonDays, now)) {
    const slots = computeSlots({
      date,
      timezone: tz,
      rules,
      overrides,
      busy,
      durationMinutes: template.durationMinutes,
      bufferBeforeMinutes: template.bufferBeforeMinutes,
      bufferAfterMinutes: template.bufferAfterMinutes,
      minNoticeMinutes: template.minNoticeMinutes,
      maxAdvanceDays: template.maxAdvanceDays,
      now,
    });
    if (slots.length === 0) continue;
    out.push({
      date,
      label: dateFmt.format(slots[0].start),
      slots: slots.map((s) => ({
        startIso: s.start.toISOString(),
        endIso: s.end.toISOString(),
        label: timeFmt.format(s.start),
      })),
    });
  }
  return out;
}

/** Calendar busy ∪ existing active bookings for the interviewer in the window. */
async function getBusy(
  orgId: string,
  interviewerId: string,
  from: Date,
  to: Date
): Promise<BusyPeriod[]> {
  const busy: BusyPeriod[] = [];

  // Existing QDX bookings (defense beyond the DB exclusion constraint).
  const { data: bookings } = await adminClient()
    .from("interview_bookings")
    .select("start_at, end_at, status")
    .eq("org_id", orgId)
    .eq("interviewer_id", interviewerId)
    .in("status", ["reserving", "confirmed", "calendar_pending"])
    .gte("start_at", from.toISOString())
    .lte("start_at", to.toISOString());
  for (const b of (bookings as { start_at: string; end_at: string }[] | null) ?? []) {
    busy.push({ start: new Date(b.start_at), end: new Date(b.end_at) });
  }

  // Live Google free/busy, if connected.
  try {
    const accessToken = await getFreshAccessToken(orgId, interviewerId, "google");
    const cal = await googleProvider.getBusyPeriods({
      accessToken,
      timeMin: from,
      timeMax: to,
    });
    busy.push(...cal);
  } catch {
    // No connection / transient error → availability-only (write-time check still guards).
  }
  return busy;
}
