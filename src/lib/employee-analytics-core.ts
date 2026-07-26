import type { OverallFit, Band } from "./assessment/scoring";
import { REVIEW_CATEGORIES } from "./review-categories";

/**
 * Pure assessment ↔ performance aggregation (no DB / no server-only imports, so
 * it's unit-testable). The DB fetch lives in ./employee-analytics.
 * Question: does a higher assessment fit predict better performance + retention?
 */

/** The four decision-relevant fit bands (Incomplete is excluded from the join). */
export const FIT_BANDS = [
  "Strong fit",
  "Consider",
  "Caution",
  "Not recommended",
] as const;
export type FitBand = (typeof FIT_BANDS)[number];

/** Below this many reviewed employees, a band's average is "too few to read". */
export const MIN_READABLE_N = 3;

export interface BandPerformance {
  band: FitBand;
  hired: number; // employees whose original fit was this band
  reviewed: number; // of those, how many have ≥1 rated review (the n)
  avgRating: number | null; // mean of per-employee average ratings; null if reviewed === 0
  readable: boolean; // reviewed >= MIN_READABLE_N
  retentionPct: number | null; // % still employed; null if hired === 0
}

export interface PerformanceByFit {
  bands: BandPerformance[]; // always the 4 bands, in FIT_BANDS order
  totalHired: number; // employees placed in a band
  totalReviewed: number;
  untrackedFit: number; // hired employees we can't place (no application / Incomplete / no score)
}

export interface EmployeeLite {
  id: string;
  application_id: string | null;
  employment_status: "employed" | "terminated";
}

function isFitBand(f: OverallFit | undefined): f is FitBand {
  return !!f && (FIT_BANDS as readonly string[]).includes(f);
}

/**
 * Pure aggregation. `avgRatingByEmployee` holds each employee's mean rating
 * (only employees with ≥1 rated review appear in it).
 */
export function bucketPerformanceByFit(input: {
  employees: EmployeeLite[];
  fit: Map<string, OverallFit>;
  avgRatingByEmployee: Map<string, number>;
}): PerformanceByFit {
  const { employees, fit, avgRatingByEmployee } = input;

  const acc: Record<
    FitBand,
    { hired: number; employed: number; ratings: number[] }
  > = {
    "Strong fit": { hired: 0, employed: 0, ratings: [] },
    Consider: { hired: 0, employed: 0, ratings: [] },
    Caution: { hired: 0, employed: 0, ratings: [] },
    "Not recommended": { hired: 0, employed: 0, ratings: [] },
  };
  let untrackedFit = 0;

  for (const e of employees) {
    const band = e.application_id ? fit.get(e.application_id) : undefined;
    if (!isFitBand(band)) {
      untrackedFit++;
      continue;
    }
    const a = acc[band];
    a.hired++;
    if (e.employment_status === "employed") a.employed++;
    const avg = avgRatingByEmployee.get(e.id);
    if (avg != null) a.ratings.push(avg);
  }

  const bands: BandPerformance[] = FIT_BANDS.map((band) => {
    const a = acc[band];
    const reviewed = a.ratings.length;
    const avgRating =
      reviewed > 0 ? a.ratings.reduce((s, r) => s + r, 0) / reviewed : null;
    return {
      band,
      hired: a.hired,
      reviewed,
      avgRating,
      readable: reviewed >= MIN_READABLE_N,
      retentionPct: a.hired > 0 ? (a.employed / a.hired) * 100 : null,
    };
  });

  return {
    bands,
    totalHired: bands.reduce((s, b) => s + b.hired, 0),
    totalReviewed: bands.reduce((s, b) => s + b.reviewed, 0),
    untrackedFit,
  };
}

// ── Per-dimension analytics ────────────────────────────────────────────────
// For each of the four assessment dimensions: does a higher ASSESSMENT band on
// that dimension predict a higher on-the-job rating on that same dimension?

/** Assessment bands, best first. */
export const ASSESS_BANDS = ["High", "Mid", "Low"] as const;
export type AssessBand = (typeof ASSESS_BANDS)[number];

export interface DimBandPerformance {
  band: AssessBand;
  count: number; // employees whose assessment band on this dimension = band
  rated: number; // of those, how many have an on-the-job rating on this dimension
  avgRating: number | null; // mean of per-employee avg on-job ratings; null if rated 0
  readable: boolean;
}

export interface DimensionPerformance {
  academic: string; // assessment category key
  label: string; // operator-facing label (e.g. "Reliability & Drive")
  bands: DimBandPerformance[]; // High / Mid / Low
  totalRated: number;
}

/**
 * Pure per-dimension aggregation. `categoryBands` maps applicationId → (academic
 * category → assessment band). `avgByEmpByCategory` maps academic category →
 * (employeeId → that employee's average on-the-job rating for that dimension).
 */
export function bucketPerformanceByDimension(input: {
  employees: EmployeeLite[];
  categoryBands: Map<string, Map<string, Band>>;
  avgByEmpByCategory: Map<string, Map<string, number>>;
}): DimensionPerformance[] {
  const { employees, categoryBands, avgByEmpByCategory } = input;

  return REVIEW_CATEGORIES.map((cat) => {
    const acc: Record<AssessBand, { count: number; ratings: number[] }> = {
      High: { count: 0, ratings: [] },
      Mid: { count: 0, ratings: [] },
      Low: { count: 0, ratings: [] },
    };
    const empAvg = avgByEmpByCategory.get(cat.academic) ?? new Map<string, number>();

    for (const e of employees) {
      if (!e.application_id) continue;
      const band = categoryBands.get(e.application_id)?.get(cat.academic);
      if (!band) continue; // no assessment band on this dimension (invalid/incomplete)
      const a = acc[band];
      a.count++;
      const avg = empAvg.get(e.id);
      if (avg != null) a.ratings.push(avg);
    }

    const bands: DimBandPerformance[] = ASSESS_BANDS.map((band) => {
      const a = acc[band];
      const rated = a.ratings.length;
      return {
        band,
        count: a.count,
        rated,
        avgRating: rated > 0 ? a.ratings.reduce((s, r) => s + r, 0) / rated : null,
        readable: rated >= MIN_READABLE_N,
      };
    });

    return {
      academic: cat.academic,
      label: cat.label,
      bands,
      totalRated: bands.reduce((s, b) => s + b.rated, 0),
    };
  });
}
