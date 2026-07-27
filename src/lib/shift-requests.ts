import "server-only";
import { adminClient } from "./supabase/admin";
import type { ShiftRow } from "./shifts-core";

/** Employee-requested shift changes: pick up an open shift, or drop one of theirs. */
export type ShiftRequestKind = "claim" | "drop";
export type ShiftRequestStatus = "pending" | "approved" | "denied" | "cancelled";

export interface ShiftRequestRow {
  id: string;
  org_id: string;
  shift_id: string;
  employee_id: string;
  kind: ShiftRequestKind;
  status: ShiftRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Published, unassigned shifts an employee could pick up (their store, upcoming). */
export async function openShiftsForEmployee(
  orgId: string,
  employeeId: string
): Promise<ShiftRow[]> {
  const supa = adminClient();
  const { data: emp } = await supa
    .from("employees")
    .select("location_id")
    .eq("id", employeeId)
    .maybeSingle();
  const locId = (emp as { location_id: string | null } | null)?.location_id ?? null;

  let q = supa
    .from("shifts")
    .select("*")
    .eq("org_id", orgId)
    .is("employee_id", null)
    .eq("status", "published")
    .gte("shift_date", todayISO())
    .order("shift_date", { ascending: true })
    .order("start_time", { ascending: true });
  if (locId) q = q.eq("location_id", locId);
  const { data } = await q;
  return (data as ShiftRow[] | null) ?? [];
}

/** Shift ids the employee has a PENDING request of a given kind for. */
export async function pendingShiftIds(
  orgId: string,
  employeeId: string,
  kind: ShiftRequestKind
): Promise<Set<string>> {
  const supa = adminClient();
  const { data } = await supa
    .from("shift_requests")
    .select("shift_id")
    .eq("org_id", orgId)
    .eq("employee_id", employeeId)
    .eq("kind", kind)
    .eq("status", "pending");
  return new Set(((data as { shift_id: string }[] | null) ?? []).map((r) => r.shift_id));
}

export interface ShiftRequestQueueItem {
  id: string;
  kind: ShiftRequestKind;
  employeeName: string;
  shift: {
    shift_date: string;
    start_time: string;
    end_time: string;
    role: string | null;
    employee_id: string | null;
  } | null;
}

/** Pending shift requests for the manager queue, with names + shift details. */
export async function pendingShiftRequests(orgId: string): Promise<ShiftRequestQueueItem[]> {
  const supa = adminClient();
  const { data } = await supa
    .from("shift_requests")
    .select("id, kind, shift_id, employee_id")
    .eq("org_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const reqs = (data as { id: string; kind: ShiftRequestKind; shift_id: string; employee_id: string }[] | null) ?? [];
  if (reqs.length === 0) return [];

  const [{ data: shifts }, { data: emps }] = await Promise.all([
    supa
      .from("shifts")
      .select("id, shift_date, start_time, end_time, role, employee_id")
      .in("id", [...new Set(reqs.map((r) => r.shift_id))]),
    supa
      .from("employees")
      .select("id, first_name, last_name")
      .in("id", [...new Set(reqs.map((r) => r.employee_id))]),
  ]);
  type ShiftLite = {
    id: string;
    shift_date: string;
    start_time: string;
    end_time: string;
    role: string | null;
    employee_id: string | null;
  };
  const shiftById = new Map(((shifts as ShiftLite[] | null) ?? []).map((s) => [s.id, s]));
  const name = new Map(
    ((emps as { id: string; first_name: string; last_name: string }[] | null) ?? []).map((e) => [
      e.id,
      `${e.first_name} ${e.last_name}`.trim(),
    ])
  );
  return reqs.map((r) => ({
    id: r.id,
    kind: r.kind,
    employeeName: name.get(r.employee_id) ?? "Employee",
    shift: shiftById.get(r.shift_id) ?? null,
  }));
}

/** Count of pending shift requests (header badge). */
export async function pendingShiftRequestCount(orgId: string): Promise<number> {
  const supa = adminClient();
  const { count } = await supa
    .from("shift_requests")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "pending");
  return count ?? 0;
}
