/**
 * Weekly availability data layer (per interviewer). Stores recurring windows as
 * availability_rules rows; the editor submits the whole week at once, so saving
 * is a replace (delete-all + insert). Times are stored as Postgres `time`
 * (HH:MM:SS); the engine works in minutes-from-midnight, so we convert here.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";

export interface WeeklyWindow {
  dayOfWeek: number; // 0=Sun..6=Sat
  startMinutes: number;
  endMinutes: number;
}

export interface WeeklySchedule {
  timezone: string;
  windows: WeeklyWindow[];
}

export function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

interface RuleRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
}

export async function getWeeklySchedule(
  orgId: string,
  userId: string
): Promise<WeeklySchedule> {
  const { data } = await adminClient()
    .from("availability_rules")
    .select("day_of_week, start_time, end_time, timezone")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true });
  const rows = (data as RuleRow[] | null) ?? [];
  return {
    timezone: rows[0]?.timezone ?? "America/New_York",
    windows: rows.map((r) => ({
      dayOfWeek: r.day_of_week,
      startMinutes: timeToMinutes(r.start_time),
      endMinutes: timeToMinutes(r.end_time),
    })),
  };
}

/** Replace the interviewer's entire weekly schedule. */
export async function setWeeklySchedule(
  orgId: string,
  userId: string,
  schedule: WeeklySchedule
): Promise<void> {
  const supa = adminClient();
  await supa
    .from("availability_rules")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", userId);
  const valid = schedule.windows.filter((w) => w.endMinutes > w.startMinutes);
  if (valid.length === 0) return;
  const rows = valid.map((w) => ({
    org_id: orgId,
    user_id: userId,
    day_of_week: w.dayOfWeek,
    start_time: minutesToTime(w.startMinutes),
    end_time: minutesToTime(w.endMinutes),
    timezone: schedule.timezone,
    is_active: true,
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supa.from("availability_rules").insert(rows as any);
  if (error) throw new Error(`setWeeklySchedule: ${error.message}`);
}
