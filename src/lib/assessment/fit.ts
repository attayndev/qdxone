/**
 * Overall fit per application for an org — the same computation the candidate
 * report uses, reduced to one OverallFit per application. Shared by the web
 * candidates list and the mobile candidates API so "Strong fit" means the same
 * thing everywhere. Service-role reads.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { scoreAssessment, assessValidity, type ScoredItem, type OverallFit, type Band } from "@/lib/assessment/scoring";
import { validitySignals, gateFitByValidity } from "@/lib/assessment/session";
import { applyGatesToFits } from "@/lib/assessment/fit-gates";
import { fetchResponsesForSessions } from "@/lib/assessment/responses";

/** A scored candidate: validity-gated overall fit + per-category academic bands. */
export interface AppScore {
  overall: OverallFit;
  categories: { category: string; band: Band }[];
  valid: boolean;
}

/**
 * Score every completed candidate session for the org, keyed by application.
 * The single source of truth reused by both the overall fit and the per-
 * category analytics. Does NOT apply custom-question gates (those cap the
 * overall only — see fitByApplication).
 */
export async function scoreByApplication(orgId: string): Promise<Map<string, AppScore>> {
  const supa = adminClient();
  const { data: sessions } = await supa
    .from("assessment_sessions")
    .select("id, application_id, methodology_version")
    .eq("org_id", orgId)
    .eq("subject_type", "candidate")
    .eq("status", "complete");
  const sess = (
    (sessions as { id: string; application_id: string | null; methodology_version: string }[] | null) ?? []
  ).filter((s) => s.application_id);
  if (sess.length === 0) return new Map();

  // Paginate past the 1000-row cap — a plain .in() drops the newest candidates'
  // responses once the org has >1000 total, leaving them with no fit.
  const responses = await fetchResponsesForSessions(sess.map((s) => s.id));

  const versions = [...new Set(sess.map((s) => s.methodology_version))];
  const { data: items } = await supa
    .from("item_bank_items")
    .select("item_id, facet, category_academic, keying")
    .in("version", versions.length ? versions : ["__none__"]);
  const meta = new Map(
    ((items as { item_id: string; facet: string; category_academic: string; keying: string }[] | null) ?? []).map(
      (i) => [i.item_id, { facet: i.facet, category: i.category_academic, keying: i.keying }]
    )
  );

  const bySession = new Map<string, ScoredItem[]>();
  const rowsBySession = new Map<string, typeof responses>();
  for (const r of responses) {
    if (!rowsBySession.has(r.session_id)) rowsBySession.set(r.session_id, []);
    rowsBySession.get(r.session_id)!.push(r);
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

  const out = new Map<string, AppScore>();
  for (const s of sess) {
    const scored = bySession.get(s.id);
    if (!scored || scored.length === 0) continue;
    // Same validity gating as the detail page: an invalid session can't show as a
    // positive fit in the list/mobile.
    const { valid } = assessValidity({ scored, ...validitySignals(rowsBySession.get(s.id) ?? []) });
    const result = scoreAssessment(scored);
    out.set(s.application_id as string, {
      overall: gateFitByValidity(result.overall, valid),
      categories: result.categories.map((c) => ({ category: c.category, band: c.band })),
      valid,
    });
  }
  return out;
}

export async function fitByApplication(orgId: string): Promise<Map<string, OverallFit>> {
  const scored = await scoreByApplication(orgId);
  const fit = new Map<string, OverallFit>();
  for (const [appId, s] of scored) fit.set(appId, s.overall);
  // Cap by custom-question gates (underage / knockout can't show as Strong).
  return applyGatesToFits(orgId, fit);
}

/**
 * Per-category assessment bands (Low/Mid/High) per application, from valid
 * sessions only — the assessment side of the per-dimension analytics.
 */
export async function categoryBandsByApplication(
  orgId: string
): Promise<Map<string, Map<string, Band>>> {
  const scored = await scoreByApplication(orgId);
  const out = new Map<string, Map<string, Band>>();
  for (const [appId, s] of scored) {
    if (!s.valid) continue;
    out.set(appId, new Map(s.categories.map((c) => [c.category, c.band])));
  }
  return out;
}
