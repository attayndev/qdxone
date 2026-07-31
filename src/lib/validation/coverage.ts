import { adminClient } from "@/lib/supabase/admin";

/**
 * Coverage / n-growth (spec §4c intro): how many employees are BOTH assessed
 * (a complete assessment session tied to their hiring application) AND
 * reviewed (≥1 rated employee_reviews row). That count — not any stat derived
 * from it — is the number that has to grow before criterion analytics are
 * actionable.
 */
export interface CoverageStats {
  employees: number;
  assessed: number;
  reviewed: number;
  assessedAndReviewed: number;
}

export async function coverageStats(orgId?: string): Promise<CoverageStats> {
  const supa = adminClient();

  let empQuery = supa.from("employees").select("id, application_id");
  if (orgId) empQuery = empQuery.eq("org_id", orgId);
  const { data: empRows } = await empQuery;
  const employees = (empRows ?? []) as { id: string; application_id: string | null }[];
  if (employees.length === 0) {
    return { employees: 0, assessed: 0, reviewed: 0, assessedAndReviewed: 0 };
  }

  const appIds = employees.map((e) => e.application_id).filter((x): x is string => !!x);
  const empIds = employees.map((e) => e.id);

  const [{ data: sessRows }, { data: reviewRows }] = await Promise.all([
    appIds.length
      ? supa
          .from("assessment_sessions")
          .select("application_id")
          .eq("subject_type", "candidate")
          .eq("status", "complete")
          .in("application_id", appIds)
      : Promise.resolve({ data: [] as { application_id: string }[] }),
    empIds.length
      ? supa
          .from("employee_reviews")
          .select("employee_id")
          .in("employee_id", empIds)
          .not("rating", "is", null)
      : Promise.resolve({ data: [] as { employee_id: string }[] }),
  ]);

  const assessedApps = new Set(
    ((sessRows ?? []) as { application_id: string }[]).map((r) => r.application_id)
  );
  const reviewedEmps = new Set(
    ((reviewRows ?? []) as { employee_id: string }[]).map((r) => r.employee_id)
  );

  let assessed = 0;
  let reviewed = 0;
  let both = 0;
  for (const e of employees) {
    const isAssessed = !!e.application_id && assessedApps.has(e.application_id);
    const isReviewed = reviewedEmps.has(e.id);
    if (isAssessed) assessed++;
    if (isReviewed) reviewed++;
    if (isAssessed && isReviewed) both++;
  }

  return { employees: employees.length, assessed, reviewed, assessedAndReviewed: both };
}
