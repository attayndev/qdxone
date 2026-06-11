import { adminClient, eeoAdmin } from "@/lib/supabase/admin";
import {
  scoreAssessment,
  type ScoredItem,
  type OverallFit,
} from "@/lib/assessment/scoring";
import {
  RACE_LABELS,
  GENDER_LABELS,
  VETERAN_LABELS,
  DISABILITY_LABELS,
} from "@/lib/eeo";

/**
 * Aggregate-only EEO / adverse-impact reporting. Reads the locked `eeo`
 * schema via the service role, joins demographics to assessment outcomes, and
 * returns ONLY aggregates with small-cell suppression — no individual row ever
 * leaves this module. This is the operator-facing fairness report and the
 * internal early-warning signal for assessment-level disparate impact.
 */

const MIN_CELL = 5; // suppress groups smaller than this (privacy + noise)
const FAVORABLE: OverallFit[] = ["Strong fit", "Consider"];

export type GroupStat = {
  value: string;
  label: string;
  n: number;
  suppressed: boolean;
  favorable: number;
  favorableRate: number | null;
  flagged: boolean; // < 80% of the highest group's rate (4/5ths)
  tiers: Record<string, number>;
};
export type DimensionReport = {
  key: string;
  label: string;
  groups: GroupStat[];
  anyFlagged: boolean;
};
export type FairnessReport = {
  respondents: number;
  declined: number;
  scored: number;
  dimensions: DimensionReport[];
};

type EeoRow = {
  application_id: string;
  declined: boolean;
  race_ethnicity: string | null;
  gender: string | null;
  veteran_status: string | null;
  disability_status: string | null;
};

export async function computeOrgFairness(orgId: string): Promise<FairnessReport> {
  const supa = adminClient();

  // 1. EEO self-ID rows (service-role only).
  const { data: eeoData } = await eeoAdmin()
    .from("responses")
    .select(
      "application_id, declined, race_ethnicity, gender, veteran_status, disability_status"
    )
    .eq("org_id", orgId);
  const eeoRows = (eeoData as EeoRow[] | null) ?? [];

  // 2. Overall fit tier per completed candidate, keyed by application_id.
  const tierByApp = await tiersByApplication(orgId);

  // 3. Aggregate each dimension.
  const dims: { key: keyof EeoRow; label: string; labels: Record<string, string> }[] = [
    { key: "race_ethnicity", label: "Race / ethnicity", labels: RACE_LABELS },
    { key: "gender", label: "Gender", labels: GENDER_LABELS },
    { key: "veteran_status", label: "Protected veteran status", labels: VETERAN_LABELS },
    { key: "disability_status", label: "Disability status", labels: DISABILITY_LABELS },
  ];

  const dimensions: DimensionReport[] = dims.map((d) =>
    aggregateDimension(d.key, d.label, d.labels, eeoRows, tierByApp)
  );

  return {
    respondents: eeoRows.length,
    declined: eeoRows.filter((r) => r.declined).length,
    scored: tierByApp.size,
    dimensions,
  };
}

function aggregateDimension(
  key: keyof EeoRow,
  label: string,
  labels: Record<string, string>,
  eeoRows: EeoRow[],
  tierByApp: Map<string, OverallFit>
): DimensionReport {
  const byValue = new Map<string, { n: number; favorable: number; tiers: Record<string, number> }>();

  for (const row of eeoRows) {
    const v = row[key];
    if (typeof v !== "string" || v === "decline") continue; // skip not-disclosed
    const tier = tierByApp.get(row.application_id);
    if (!tier) continue; // only candidates with a scored assessment
    if (!byValue.has(v)) byValue.set(v, { n: 0, favorable: 0, tiers: {} });
    const g = byValue.get(v)!;
    g.n += 1;
    g.tiers[tier] = (g.tiers[tier] ?? 0) + 1;
    if (FAVORABLE.includes(tier)) g.favorable += 1;
  }

  let groups: GroupStat[] = [...byValue.entries()].map(([value, g]) => {
    const suppressed = g.n < MIN_CELL;
    return {
      value,
      label: labels[value] ?? value,
      n: g.n,
      suppressed,
      favorable: g.favorable,
      favorableRate: suppressed ? null : g.favorable / g.n,
      flagged: false,
      tiers: g.tiers,
    };
  });

  // 4/5ths rule across non-suppressed groups.
  const rates = groups.filter((g) => g.favorableRate != null).map((g) => g.favorableRate!);
  const maxRate = rates.length ? Math.max(...rates) : 0;
  groups = groups.map((g) =>
    g.favorableRate != null && maxRate > 0 && g.favorableRate < 0.8 * maxRate
      ? { ...g, flagged: true }
      : g
  );
  groups.sort((a, b) => b.n - a.n);

  return { key: String(key), label, groups, anyFlagged: groups.some((g) => g.flagged) };
}

/** Compute the overall fit tier for every completed candidate in the org. */
async function tiersByApplication(orgId: string): Promise<Map<string, OverallFit>> {
  const supa = adminClient();
  const { data: sessions } = await supa
    .from("assessment_sessions")
    .select("id, application_id, methodology_version")
    .eq("org_id", orgId)
    .eq("subject_type", "candidate")
    .eq("status", "complete");
  const sess = (sessions ?? []).filter((s) => s.application_id);
  if (sess.length === 0) return new Map();

  const sessionIds = sess.map((s) => s.id);
  const { data: resp } = await supa
    .from("assessment_responses")
    .select("session_id, item_id, item_kind, value_int")
    .in("session_id", sessionIds);
  const responses = resp ?? [];

  // Item metadata (facet/category/keying) for the versions in play.
  const versions = [...new Set(sess.map((s) => s.methodology_version))];
  const { data: items } = await supa
    .from("item_bank_items")
    .select("item_id, facet, category_academic, keying")
    .in("version", versions.length ? versions : ["__none__"]);
  const meta = new Map(
    (items ?? []).map((i) => [
      i.item_id,
      { facet: i.facet, category: i.category_academic, keying: i.keying },
    ])
  );

  const bySession = new Map<string, ScoredItem[]>();
  for (const r of responses) {
    if (r.item_kind !== "personality" || r.value_int == null) continue;
    const m = meta.get(r.item_id);
    if (!m) continue;
    if (!bySession.has(r.session_id)) bySession.set(r.session_id, []);
    bySession.get(r.session_id)!.push({
      value: r.value_int,
      facet: m.facet,
      category: m.category,
      keying: m.keying === "reverse" ? "reverse" : "positive",
    });
  }

  const tierByApp = new Map<string, OverallFit>();
  for (const s of sess) {
    const scored = bySession.get(s.id);
    if (!scored || scored.length === 0) continue;
    const result = scoreAssessment(scored);
    if (result.overall !== "Incomplete") {
      tierByApp.set(s.application_id as string, result.overall);
    }
  }
  return tierByApp;
}
