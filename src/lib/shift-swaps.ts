import "server-only";
import { adminClient } from "./supabase/admin";
import type { ShiftRow } from "./shifts-core";

/** Directed two-party trade: A offers their shift (from) for coworker B's shift (to). */
export type ShiftSwapStatus =
  | "proposed"
  | "accepted"
  | "approved"
  | "declined"
  | "cancelled";

export interface ShiftSwapRow {
  id: string;
  org_id: string;
  from_employee_id: string;
  from_shift_id: string;
  to_employee_id: string;
  to_shift_id: string;
  status: ShiftSwapStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

/** A shift trimmed to what the swap UI renders. */
export interface SwapShiftLite {
  id: string;
  employee_id: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  role: string | null;
}

/** A hydrated swap: both sides named, both shifts resolved (null if since deleted). */
export interface SwapView {
  id: string;
  status: ShiftSwapStatus;
  fromEmployeeId: string;
  toEmployeeId: string;
  fromName: string;
  toName: string;
  fromShift: SwapShiftLite | null;
  toShift: SwapShiftLite | null;
  created_at: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** A coworker plus the upcoming shifts of theirs an employee could trade for. */
export interface SwapTarget {
  employeeId: string;
  name: string;
  shifts: SwapShiftLite[];
}

/**
 * Coworkers at the employee's location with ≥1 upcoming published, assigned shift —
 * the pool of shifts the employee can propose to trade for.
 */
export async function swapTargetsForEmployee(
  orgId: string,
  employeeId: string
): Promise<SwapTarget[]> {
  const supa = adminClient();
  const { data: me } = await supa
    .from("employees")
    .select("location_id")
    .eq("id", employeeId)
    .maybeSingle();
  const locId = (me as { location_id: string | null } | null)?.location_id ?? null;

  const { data: emps } = await supa
    .from("employees")
    .select("id, first_name, last_name")
    .eq("org_id", orgId)
    .eq("employment_status", "employed")
    .neq("id", employeeId);
  const coworkers = (emps as { id: string; first_name: string; last_name: string }[] | null) ?? [];
  if (coworkers.length === 0) return [];
  const coworkerIds = coworkers.map((e) => e.id);

  let q = supa
    .from("shifts")
    .select("id, employee_id, shift_date, start_time, end_time, role")
    .eq("org_id", orgId)
    .eq("status", "published")
    .gte("shift_date", todayISO())
    .in("employee_id", coworkerIds)
    .order("shift_date", { ascending: true })
    .order("start_time", { ascending: true });
  if (locId) q = q.eq("location_id", locId);
  const { data: shifts } = await q;

  const byEmp = new Map<string, SwapShiftLite[]>();
  for (const s of (shifts as SwapShiftLite[] | null) ?? []) {
    if (!s.employee_id) continue;
    const list = byEmp.get(s.employee_id) ?? [];
    list.push(s);
    byEmp.set(s.employee_id, list);
  }

  return coworkers
    .map((e) => ({
      employeeId: e.id,
      name: `${e.first_name} ${e.last_name}`.trim(),
      shifts: byEmp.get(e.id) ?? [],
    }))
    .filter((t) => t.shifts.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Resolve a set of swap rows into named, shift-populated views. */
async function hydrateSwaps(rows: ShiftSwapRow[]): Promise<SwapView[]> {
  if (rows.length === 0) return [];
  const supa = adminClient();
  const shiftIds = [...new Set(rows.flatMap((r) => [r.from_shift_id, r.to_shift_id]))];
  const empIds = [...new Set(rows.flatMap((r) => [r.from_employee_id, r.to_employee_id]))];

  const [{ data: shifts }, { data: emps }] = await Promise.all([
    supa
      .from("shifts")
      .select("id, employee_id, shift_date, start_time, end_time, role")
      .in("id", shiftIds),
    supa.from("employees").select("id, first_name, last_name").in("id", empIds),
  ]);
  const shiftById = new Map(((shifts as SwapShiftLite[] | null) ?? []).map((s) => [s.id, s]));
  const name = new Map(
    ((emps as { id: string; first_name: string; last_name: string }[] | null) ?? []).map((e) => [
      e.id,
      `${e.first_name} ${e.last_name}`.trim(),
    ])
  );
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    fromEmployeeId: r.from_employee_id,
    toEmployeeId: r.to_employee_id,
    fromName: name.get(r.from_employee_id) ?? "Employee",
    toName: name.get(r.to_employee_id) ?? "Employee",
    fromShift: shiftById.get(r.from_shift_id) ?? null,
    toShift: shiftById.get(r.to_shift_id) ?? null,
    created_at: r.created_at,
  }));
}

/** Swaps proposed TO this employee, awaiting their accept/decline. */
export async function incomingSwaps(orgId: string, employeeId: string): Promise<SwapView[]> {
  const supa = adminClient();
  const { data } = await supa
    .from("shift_swaps")
    .select("*")
    .eq("org_id", orgId)
    .eq("to_employee_id", employeeId)
    .eq("status", "proposed")
    .order("created_at", { ascending: true });
  return hydrateSwaps((data as ShiftSwapRow[] | null) ?? []);
}

/** Swaps this employee proposed that are still in flight (proposed or peer-accepted). */
export async function outgoingSwaps(orgId: string, employeeId: string): Promise<SwapView[]> {
  const supa = adminClient();
  const { data } = await supa
    .from("shift_swaps")
    .select("*")
    .eq("org_id", orgId)
    .eq("from_employee_id", employeeId)
    .in("status", ["proposed", "accepted"])
    .order("created_at", { ascending: true });
  return hydrateSwaps((data as ShiftSwapRow[] | null) ?? []);
}

/** Shift ids the employee has tied up in an in-flight swap (either side) — for a "swap pending" marker. */
export async function activeSwapShiftIds(
  orgId: string,
  employeeId: string
): Promise<Set<string>> {
  const supa = adminClient();
  const { data } = await supa
    .from("shift_swaps")
    .select("from_shift_id, to_shift_id, from_employee_id, to_employee_id")
    .eq("org_id", orgId)
    .in("status", ["proposed", "accepted"])
    .or(`from_employee_id.eq.${employeeId},to_employee_id.eq.${employeeId}`);
  const ids = new Set<string>();
  for (const r of (data as
    | { from_shift_id: string; to_shift_id: string; from_employee_id: string; to_employee_id: string }[]
    | null) ?? []) {
    if (r.from_employee_id === employeeId) ids.add(r.from_shift_id);
    if (r.to_employee_id === employeeId) ids.add(r.to_shift_id);
  }
  return ids;
}

/** Peer-accepted swaps awaiting manager approval — the Requests queue. */
export async function acceptedSwapsQueue(orgId: string): Promise<SwapView[]> {
  const supa = adminClient();
  const { data } = await supa
    .from("shift_swaps")
    .select("*")
    .eq("org_id", orgId)
    .eq("status", "accepted")
    .order("created_at", { ascending: true });
  return hydrateSwaps((data as ShiftSwapRow[] | null) ?? []);
}

/** Count of swaps awaiting manager approval (header badge). */
export async function acceptedSwapCount(orgId: string): Promise<number> {
  const supa = adminClient();
  const { count } = await supa
    .from("shift_swaps")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "accepted");
  return count ?? 0;
}

/**
 * Would trading `moveShift` onto `ontoEmployeeId` double-book them? Pure overlap
 * guard used at approve time (both directions of the trade get checked).
 */
export function tradeDoubleBooks(
  ontoEmployeeShifts: Pick<ShiftRow, "id" | "shift_date" | "start_time" | "end_time">[],
  moveShift: Pick<ShiftRow, "id" | "shift_date" | "start_time" | "end_time">,
  excludeShiftId: string
): boolean {
  return ontoEmployeeShifts.some(
    (s) =>
      s.id !== excludeShiftId &&
      s.id !== moveShift.id &&
      s.shift_date === moveShift.shift_date &&
      s.start_time < moveShift.end_time &&
      moveShift.start_time < s.end_time
  );
}
