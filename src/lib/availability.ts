import "server-only";
import { adminClient } from "./supabase/admin";
import type { UnavailBlock } from "./shifts-core";

/** Recurring block-off (unavailability) — the times an employee can't work. */
export interface UnavailabilityRow extends UnavailBlock {
  id: string;
  org_id: string;
  employee_id: string;
  note: string | null;
  created_at: string;
}

const COLS = "id, org_id, employee_id, day_of_week, all_day, start_time, end_time, note, created_at";

/** One employee's block-off list (the /staff availability editor). */
export async function listUnavailabilityForEmployee(
  orgId: string,
  employeeId: string
): Promise<UnavailabilityRow[]> {
  const supa = adminClient();
  const { data } = await supa
    .from("employee_unavailability")
    .select(COLS)
    .eq("org_id", orgId)
    .eq("employee_id", employeeId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });
  return (data as UnavailabilityRow[] | null) ?? [];
}

/** All employees' blocks for an org, keyed by employee_id (the builder). */
export async function unavailabilityByEmployee(
  orgId: string
): Promise<Map<string, UnavailabilityRow[]>> {
  const supa = adminClient();
  const { data } = await supa
    .from("employee_unavailability")
    .select(COLS)
    .eq("org_id", orgId);
  const out = new Map<string, UnavailabilityRow[]>();
  for (const r of (data as UnavailabilityRow[] | null) ?? []) {
    if (!out.has(r.employee_id)) out.set(r.employee_id, []);
    out.get(r.employee_id)!.push(r);
  }
  return out;
}

/** Blocks for one employee (for the create/update-shift soft warning). */
export async function unavailabilityForEmployee(
  orgId: string,
  employeeId: string
): Promise<UnavailBlock[]> {
  return (await listUnavailabilityForEmployee(orgId, employeeId)).map((b) => ({
    day_of_week: b.day_of_week,
    all_day: b.all_day,
    start_time: b.start_time,
    end_time: b.end_time,
  }));
}
