import { adminClient } from "./supabase/admin";
import { getOrgLocations } from "./locations";

/**
 * Employee tracking: a hired candidate followed through their employment
 * lifecycle (current role, promotions, quarterly reviews, termination).
 * Tables added in migration 0023 (not in generated types yet — typed here).
 */

// New hires are reviewed MONTHLY for their first 3 months, then QUARTERLY.
export const ONBOARDING_MONTHS = 3;
export const MONTHLY_INTERVAL = 1;
export const QUARTERLY_INTERVAL = 3;

export type EmploymentStatus = "employed" | "terminated";

/** 1..5 performance rating, shown with a label. */
export const RATING_LABELS: Record<number, string> = {
  1: "Not meeting expectations",
  2: "Below expectations",
  3: "Meets expectations",
  4: "Exceeds expectations",
  5: "Outstanding",
};

export function ratingLabel(rating: number | null | undefined): string | null {
  if (rating == null) return null;
  return RATING_LABELS[rating] ?? null;
}

export interface EmployeeRow {
  id: string;
  org_id: string;
  location_id: string | null;
  application_id: string | null;
  first_name: string;
  last_name: string;
  current_role_name: string | null;
  employment_status: EmploymentStatus;
  hired_at: string; // date
  terminated_at: string | null;
  termination_reason: string | null;
  next_review_due: string | null; // date
  created_at: string;
  updated_at: string;
}

export interface EmployeeReviewRow {
  id: string;
  employee_id: string;
  org_id: string;
  reviewed_at: string;
  reviewed_by: string | null;
  role_at_review: string | null;
  rating: number | null;
  still_employed: boolean;
  notes: string | null;
  created_at: string;
}

export interface EmployeeRoleChangeRow {
  id: string;
  employee_id: string;
  org_id: string;
  from_role: string | null;
  to_role: string;
  changed_at: string;
  changed_by: string | null;
  created_at: string;
}

/**
 * Add whole months to a date, returning a YYYY-MM-DD string (date-only).
 * Uses UTC arithmetic so calendar math never shifts a day across a DST boundary.
 */
export function addMonths(from: Date, months: number): string {
  const d = new Date(from.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * The next review date. New hires are reviewed monthly for their first 3
 * months, then quarterly. `from` is the point we schedule from (the hire date
 * at creation, or the just-completed review's date); `hiredAt` anchors the
 * onboarding window.
 */
export function nextReviewDue(from: Date, hiredAt: Date): string {
  const onboardingEnd = new Date(hiredAt.getTime());
  onboardingEnd.setUTCMonth(onboardingEnd.getUTCMonth() + ONBOARDING_MONTHS);
  const months = from < onboardingEnd ? MONTHLY_INTERVAL : QUARTERLY_INTERVAL;
  return addMonths(from, months);
}

/** Is this employee due (or overdue) for a review? Terminated → never. */
export function isReviewDue(e: {
  employment_status: EmploymentStatus;
  next_review_due: string | null;
}): boolean {
  if (e.employment_status !== "employed" || !e.next_review_due) return false;
  return e.next_review_due <= new Date().toISOString().slice(0, 10);
}

/** An employee row enriched for list/detail rendering. */
export interface EmployeeView extends EmployeeRow {
  locationName: string | null;
  lastReviewAt: string | null;
  lastRating: number | null;
  reviewDue: boolean;
}

function toView(
  e: EmployeeRow,
  locName: string | null,
  last: { reviewed_at: string; rating: number | null } | null
): EmployeeView {
  return {
    ...e,
    locationName: locName,
    lastReviewAt: last?.reviewed_at ?? null,
    lastRating: last?.rating ?? null,
    reviewDue: isReviewDue(e),
  };
}

/** All employees for an org, enriched with store name + latest review. */
export async function listEmployees(orgId: string): Promise<EmployeeView[]> {
  const supa = adminClient();
  const [{ data: emps }, locs] = await Promise.all([
    supa
      .from("employees")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    getOrgLocations(orgId),
  ]);
  const employees = (emps as EmployeeRow[] | null) ?? [];
  const locName = new Map(locs.map((l) => [l.id, l.name]));

  // Latest review per employee (one org-wide query, reduced in memory).
  const ids = employees.map((e) => e.id);
  const latest = new Map<string, { reviewed_at: string; rating: number | null }>();
  if (ids.length) {
    const { data: reviews } = await supa
      .from("employee_reviews")
      .select("employee_id, reviewed_at, rating")
      .in("employee_id", ids)
      .order("reviewed_at", { ascending: false });
    for (const r of (reviews as EmployeeReviewRow[] | null) ?? []) {
      if (!latest.has(r.employee_id)) {
        latest.set(r.employee_id, { reviewed_at: r.reviewed_at, rating: r.rating });
      }
    }
  }

  return employees.map((e) =>
    toView(e, e.location_id ? locName.get(e.location_id) ?? null : null, latest.get(e.id) ?? null)
  );
}

export interface EmployeeDetail {
  employee: EmployeeView;
  reviews: EmployeeReviewRow[];
  roleChanges: EmployeeRoleChangeRow[];
}

/** One employee with full review + promotion history. */
export async function getEmployee(
  orgId: string,
  id: string
): Promise<EmployeeDetail | null> {
  const supa = adminClient();
  const { data: emp } = await supa
    .from("employees")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .maybeSingle();
  const employee = emp as EmployeeRow | null;
  if (!employee) return null;

  const [{ data: reviews }, { data: changes }, locs] = await Promise.all([
    supa
      .from("employee_reviews")
      .select("*")
      .eq("employee_id", id)
      .order("reviewed_at", { ascending: false }),
    supa
      .from("employee_role_changes")
      .select("*")
      .eq("employee_id", id)
      .order("changed_at", { ascending: false }),
    getOrgLocations(orgId),
  ]);
  const rv = (reviews as EmployeeReviewRow[] | null) ?? [];
  const locName = employee.location_id
    ? locs.find((l) => l.id === employee.location_id)?.name ?? null
    : null;
  const last = rv[0] ? { reviewed_at: rv[0].reviewed_at, rating: rv[0].rating } : null;

  return {
    employee: toView(employee, locName, last),
    reviews: rv,
    roleChanges: (changes as EmployeeRoleChangeRow[] | null) ?? [],
  };
}

/** Count of employees due (or overdue) for a review — for the nav/list badge. */
export async function reviewsDueCount(orgId: string): Promise<number> {
  const supa = adminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supa
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("employment_status", "employed")
    .lte("next_review_due", today);
  return count ?? 0;
}

/**
 * Create an employee for a just-hired application if one doesn't exist yet.
 * Idempotent (unique index on application_id). Starting role defaults to the
 * position applied for; logs the initial role change. Safe to call repeatedly.
 */
export async function ensureEmployeeForHire(params: {
  orgId: string;
  applicationId: string;
  hiredAt?: Date;
}): Promise<void> {
  const supa = adminClient();
  const { data: existing } = await supa
    .from("employees")
    .select("id")
    .eq("application_id", params.applicationId)
    .maybeSingle();
  if (existing) return;

  const { data: appRow } = await supa
    .from("applications")
    .select("org_id, location_id, first_name, last_name, positions, decision_at")
    .eq("id", params.applicationId)
    .maybeSingle();
  const app = appRow as {
    org_id: string;
    location_id: string | null;
    first_name: string;
    last_name: string;
    positions: string[] | null;
    decision_at: string | null;
  } | null;
  if (!app) return;

  const startRole = app.positions?.[0] ?? null;
  const hiredAt =
    params.hiredAt ?? (app.decision_at ? new Date(app.decision_at) : new Date());

  const { data: inserted, error } = await supa
    .from("employees")
    .insert({
      org_id: params.orgId,
      location_id: app.location_id,
      application_id: params.applicationId,
      first_name: app.first_name,
      last_name: app.last_name,
      current_role_name: startRole,
      employment_status: "employed",
      hired_at: hiredAt.toISOString().slice(0, 10),
      next_review_due: nextReviewDue(hiredAt, hiredAt),
    } as never)
    .select("id")
    .maybeSingle();
  // A race (unique violation) means another call already created it — fine.
  if (error || !inserted) return;

  if (startRole) {
    const empId = (inserted as { id: string }).id;
    await supa.from("employee_role_changes").insert({
      employee_id: empId,
      org_id: params.orgId,
      from_role: null,
      to_role: startRole,
    } as never);
  }
}

/**
 * Backfill: create employee records for every existing hired application that
 * doesn't have one yet. Idempotent; returns how many were created.
 */
export async function backfillEmployeesForOrg(orgId: string): Promise<number> {
  const supa = adminClient();
  const { data: hires } = await supa
    .from("applications")
    .select("id")
    .eq("org_id", orgId)
    .eq("decision", "hired");
  const rows = (hires as { id: string }[] | null) ?? [];
  let created = 0;
  for (const r of rows) {
    const { data: existing } = await supa
      .from("employees")
      .select("id")
      .eq("application_id", r.id)
      .maybeSingle();
    if (existing) continue;
    await ensureEmployeeForHire({ orgId, applicationId: r.id });
    created++;
  }
  return created;
}
