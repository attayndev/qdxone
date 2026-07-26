import { adminClient } from "./supabase/admin";
import { listEmployees } from "./employees";
import { fitByApplication, categoryBandsByApplication } from "./assessment/fit";
import { REVIEW_CATEGORIES } from "./review-categories";
import {
  bucketPerformanceByFit,
  bucketPerformanceByDimension,
  type PerformanceByFit,
  type DimensionPerformance,
} from "./employee-analytics-core";

export * from "./employee-analytics-core";

/** Fetch + aggregate performance-by-fit for an org. */
export async function analyzePerformanceByFit(
  orgId: string
): Promise<PerformanceByFit> {
  const [employees, fit] = await Promise.all([
    listEmployees(orgId),
    fitByApplication(orgId),
  ]);

  // Per-employee average rating across their rated reviews.
  const avgRatingByEmployee = new Map<string, number>();
  const ids = employees.map((e) => e.id);
  if (ids.length) {
    const supa = adminClient();
    const { data } = await supa
      .from("employee_reviews")
      .select("employee_id, rating")
      .in("employee_id", ids)
      .not("rating", "is", null);
    const sums = new Map<string, { sum: number; n: number }>();
    for (const r of (data as { employee_id: string; rating: number }[] | null) ?? []) {
      const cur = sums.get(r.employee_id) ?? { sum: 0, n: 0 };
      cur.sum += r.rating;
      cur.n += 1;
      sums.set(r.employee_id, cur);
    }
    for (const [id, { sum, n }] of sums) avgRatingByEmployee.set(id, sum / n);
  }

  return bucketPerformanceByFit({
    employees: employees.map((e) => ({
      id: e.id,
      application_id: e.application_id,
      employment_status: e.employment_status,
    })),
    fit,
    avgRatingByEmployee,
  });
}

/** Fetch + aggregate the per-dimension "assessment predicts this dimension" view. */
export async function analyzePerformanceByDimension(
  orgId: string
): Promise<DimensionPerformance[]> {
  const [employees, categoryBands] = await Promise.all([
    listEmployees(orgId),
    categoryBandsByApplication(orgId),
  ]);
  const lite = employees.map((e) => ({
    id: e.id,
    application_id: e.application_id,
    employment_status: e.employment_status,
  }));

  // Per employee, per dimension: average of that dimension's non-null ratings.
  // academic category → (employeeId → avg on-job rating).
  const avgByEmpByCategory = new Map<string, Map<string, number>>();
  for (const c of REVIEW_CATEGORIES) avgByEmpByCategory.set(c.academic, new Map());

  const ids = employees.map((e) => e.id);
  if (ids.length) {
    const supa = adminClient();
    const cols = REVIEW_CATEGORIES.map((c) => c.column).join(", ");
    const { data } = await supa
      .from("employee_reviews")
      .select(`employee_id, ${cols}`)
      .in("employee_id", ids);
    const rows = (data as Record<string, number | string | null>[] | null) ?? [];
    // sums[academic] : empId -> {sum, n}
    const sums = new Map<string, Map<string, { sum: number; n: number }>>();
    for (const c of REVIEW_CATEGORIES) sums.set(c.academic, new Map());
    for (const r of rows) {
      const empId = r.employee_id as string;
      for (const c of REVIEW_CATEGORIES) {
        const v = r[c.column];
        if (typeof v !== "number") continue;
        const m = sums.get(c.academic)!;
        const cur = m.get(empId) ?? { sum: 0, n: 0 };
        cur.sum += v;
        cur.n += 1;
        m.set(empId, cur);
      }
    }
    for (const c of REVIEW_CATEGORIES) {
      const out = avgByEmpByCategory.get(c.academic)!;
      for (const [empId, { sum, n }] of sums.get(c.academic)!) out.set(empId, sum / n);
    }
  }

  return bucketPerformanceByDimension({
    employees: lite,
    categoryBands,
    avgByEmpByCategory,
  });
}
