import { adminClient } from "./supabase/admin";
import { listEmployees } from "./employees";
import { fitByApplication } from "./assessment/fit";
import { bucketPerformanceByFit, type PerformanceByFit } from "./employee-analytics-core";

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
