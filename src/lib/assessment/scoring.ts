/**
 * Scoring engine (pre-pilot, Tier-1 raw anchors). Turns raw assessment
 * responses into facet/category means, verbal bands, an overall-fit tier,
 * the attitude composite, and a screener profile. Pure — no DB.
 *
 * Per the methodology: reverse-keyed items scored as (6 − raw); facet =
 * mean of its items; category = equal-weight mean of its facets; bands via
 * raw anchors (High ≥ 4.0, Mid ≥ 3.0, Low < 3.0). All placeholder until the
 * validation pilot supplies empirical weights/norms.
 */

export type Band = "Low" | "Mid" | "High";
export type OverallFit =
  | "Strong fit"
  | "Consider"
  | "Caution"
  | "Not recommended"
  | "Incomplete";

export interface ScoredItem {
  value: number; // 1-5 raw
  facet: string;
  category: string; // academic category key
  keying: "positive" | "reverse";
}

export interface FacetScore {
  facet: string;
  mean: number;
  band: Band;
  n: number;
}
export interface CategoryScore {
  category: string;
  categoryUi: string;
  mean: number;
  band: Band;
  facets: FacetScore[];
}
export interface ScoreResult {
  categories: CategoryScore[];
  overall: OverallFit;
  attitude: { mean: number; band: Band } | null;
  stars: number; // 0-5
}

const CATEGORY_ORDER = [
  "Conscientiousness",
  "Agreeableness",
  "Self-Direction",
  "Emotional Stability",
];
const ATTITUDE_FACETS = new Set([
  "Coachability",
  "Customer Warmth",
  "Team Cooperation",
]);

const bandFor = (m: number): Band => (m >= 4 ? "High" : m >= 3 ? "Mid" : "Low");
const keyed = (it: ScoredItem): number =>
  it.keying === "reverse" ? 6 - it.value : it.value;
const avg = (xs: number[]): number =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

export function scoreAssessment(
  items: ScoredItem[],
  categoryUi: Record<string, string> = {}
): ScoreResult {
  const byCat = new Map<string, Map<string, number[]>>();
  for (const it of items) {
    if (it.value == null) continue;
    if (!byCat.has(it.category)) byCat.set(it.category, new Map());
    const facets = byCat.get(it.category)!;
    if (!facets.has(it.facet)) facets.set(it.facet, []);
    facets.get(it.facet)!.push(keyed(it));
  }

  const categories: CategoryScore[] = [];
  for (const [cat, facetMap] of byCat) {
    const facets: FacetScore[] = [];
    for (const [facet, vals] of facetMap) {
      const m = avg(vals);
      facets.push({ facet, mean: m, band: bandFor(m), n: vals.length });
    }
    const catMean = avg(facets.map((f) => f.mean)); // equal-weight facets
    categories.push({
      category: cat,
      categoryUi: categoryUi[cat] ?? cat,
      mean: catMean,
      band: bandFor(catMean),
      facets,
    });
  }

  const ord = (c: string) => {
    const i = CATEGORY_ORDER.indexOf(c);
    return i === -1 ? 99 : i;
  };
  categories.sort((a, b) => ord(a.category) - ord(b.category));

  // Overall fit (priority order). Ownership = Self-Direction; gated to ≥ Mid.
  const bands = categories.map((c) => c.band);
  const high = bands.filter((b) => b === "High").length;
  const low = bands.filter((b) => b === "Low").length;
  const ownership = categories.find((c) => c.category === "Self-Direction")?.band;
  let overall: OverallFit;
  if (categories.length < 4) overall = "Incomplete";
  else if (high >= 3 && low === 0 && ownership !== "Low") overall = "Strong fit";
  else if (low >= 2) overall = "Not recommended";
  else if (high >= 2 && low <= 1) overall = "Consider";
  else if (low === 1) overall = "Caution";
  else overall = "Consider";

  const attVals = items.filter((it) => ATTITUDE_FACETS.has(it.facet)).map(keyed);
  const attitude = attVals.length
    ? { mean: avg(attVals), band: bandFor(avg(attVals)) }
    : null;

  const stars =
    overall === "Strong fit"
      ? 5
      : overall === "Consider"
        ? 4
        : overall === "Caution"
          ? 2
          : overall === "Not recommended"
            ? 1
            : 0;

  return { categories, overall, attitude, stars };
}

// ── Screener profile (categorical flags, not a score) ──────────────────
export type FlagTone = "positive" | "neutral" | "concern";
export interface ScreenerFlag {
  label: string;
  tone: FlagTone;
}

/**
 * Build the screener profile. EEOC-safe: MOT-01 option 2 ("need steady
 * income") is NEVER scored negatively. MOT-04 (past attendance) is the
 * highest-validity item.
 */
export function screenerProfile(
  answers: Record<string, number | null | undefined>
): ScreenerFlag[] {
  const flags: ScreenerFlag[] = [];
  const m01 = answers["MOT-01"];
  if (m01 === 1 || m01 === 3)
    flags.push({ label: "Concrete goal / career-oriented", tone: "positive" });

  const m03 = answers["MOT-03"];
  if (m03 === 4 || m03 === 5)
    flags.push({ label: "Expects to stay 2+ years", tone: "positive" });
  else if (m03 === 3)
    flags.push({ label: "Tenure expectation: 1–2 years", tone: "neutral" });
  else if (m03 === 1)
    flags.push({ label: "Tenure expectation: under 6 months", tone: "concern" });

  const m04 = answers["MOT-04"];
  if (m04 === 1)
    flags.push({ label: "Zero missed shifts (last 6 mo)", tone: "positive" });
  else if (m04 === 3)
    flags.push({ label: "3–5 missed shifts (last 6 mo)", tone: "concern" });
  else if (m04 === 4)
    flags.push({ label: "6+ missed shifts (last 6 mo)", tone: "concern" });

  const m05 = answers["MOT-05"];
  if (m05 === 3 || m05 === 4)
    flags.push({ label: "Strong job-fit signal (referral/brand)", tone: "positive" });

  return flags;
}
