import "server-only";
import { adminClient } from "./supabase/admin";
import type { TimeOffRange } from "./shifts-core";

export type TimeOffStatus = "pending" | "approved" | "denied";

export interface TimeOffRequestRow {
  id: string;
  org_id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  status: TimeOffStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

const COLS =
  "id, org_id, employee_id, start_date, end_date, all_day, start_time, end_time, reason, status, reviewed_by, reviewed_at, review_note, created_at";

/** An employee's own requests (all statuses), newest first. */
export async function listTimeOffForEmployee(
  orgId: string,
  employeeId: string
): Promise<TimeOffRequestRow[]> {
  const supa = adminClient();
  const { data } = await supa
    .from("time_off_requests")
    .select(COLS)
    .eq("org_id", orgId)
    .eq("employee_id", employeeId)
    .order("start_date", { ascending: false });
  return (data as TimeOffRequestRow[] | null) ?? [];
}

export interface TimeOffQueueItem extends TimeOffRequestRow {
  employeeName: string;
}

/** Pending requests for the manager queue, with employee names. */
export async function pendingTimeOff(orgId: string): Promise<TimeOffQueueItem[]> {
  const supa = adminClient();
  const { data } = await supa
    .from("time_off_requests")
    .select(COLS)
    .eq("org_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const reqs = (data as TimeOffRequestRow[] | null) ?? [];
  if (reqs.length === 0) return [];
  const { data: emps } = await supa
    .from("employees")
    .select("id, first_name, last_name")
    .in("id", [...new Set(reqs.map((r) => r.employee_id))]);
  const name = new Map(
    ((emps as { id: string; first_name: string; last_name: string }[] | null) ?? []).map((e) => [
      e.id,
      `${e.first_name} ${e.last_name}`.trim(),
    ])
  );
  return reqs.map((r) => ({ ...r, employeeName: name.get(r.employee_id) ?? "Employee" }));
}

/** Count of pending requests (nav/header badge). */
export async function pendingTimeOffCount(orgId: string): Promise<number> {
  const supa = adminClient();
  const { count } = await supa
    .from("time_off_requests")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "pending");
  return count ?? 0;
}

/** Approved time-off ranges per employee (builder markers + warnings). */
export async function approvedTimeOffByEmployee(
  orgId: string
): Promise<Map<string, TimeOffRange[]>> {
  const supa = adminClient();
  const { data } = await supa
    .from("time_off_requests")
    .select("employee_id, start_date, end_date, all_day, start_time, end_time")
    .eq("org_id", orgId)
    .eq("status", "approved");
  const out = new Map<string, TimeOffRange[]>();
  for (const r of (data as (TimeOffRange & { employee_id: string })[] | null) ?? []) {
    if (!out.has(r.employee_id)) out.set(r.employee_id, []);
    out.get(r.employee_id)!.push({
      start_date: r.start_date,
      end_date: r.end_date,
      all_day: r.all_day,
      start_time: r.start_time,
      end_time: r.end_time,
    });
  }
  return out;
}

/** Approved ranges for one employee (create/update-shift warning). */
export async function approvedTimeOffForEmployee(
  orgId: string,
  employeeId: string
): Promise<TimeOffRange[]> {
  return (await approvedTimeOffByEmployee(orgId)).get(employeeId) ?? [];
}
