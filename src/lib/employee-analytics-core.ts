import type { OverallFit } from "./assessment/scoring";

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
