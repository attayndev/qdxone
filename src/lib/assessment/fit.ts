/**
 * Overall fit per application for an org — the same computation the candidate
 * report uses, reduced to one OverallFit per application. Shared by the web
 * candidates list and the mobile candidates API so "Strong fit" means the same
 * thing everywhere. Service-role reads.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { scoreAssessment, assessValidity, type ScoredItem, type OverallFit } from "@/lib/assessment/scoring";
import { validitySignals, gateFitByValidity } from "@/lib/assessment/session";
import { applyGatesToFits } from "@/lib/assessment/fit-gates";

export async function fitByApplication(orgId: string): Promise<Map<string, OverallFit>> {
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

  const { data: resp } = await supa
    .from("assessment_responses")
    .select("session_id, item_id, item_kind, value_int, response_ms")
    .in("session_id", sess.map((s) => s.id));
  const responses =
    (resp as {
      session_id: string;
      item_id: string;
      item_kind: string;
      value_int: number | null;
      response_ms: number | null;
    }[] | null) ?? [];

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

  const fit = new Map<string, OverallFit>();
  for (const s of sess) {
    const scored = bySession.get(s.id);
    if (!scored || scored.length === 0) continue;
    // Same validity gating as the detail page: an invalid session can't show as a
    // positive fit in the list/mobile.
    const { valid } = assessValidity({ scored, ...validitySignals(rowsBySession.get(s.id) ?? []) });
    fit.set(s.application_id as string, gateFitByValidity(scoreAssessment(scored).overall, valid));
  }
  // Cap by custom-question gates (underage / knockout can't show as Strong).
  return applyGatesToFits(orgId, fit);
}
