/**
 * Scored candidate list for the mobile app. Reuses the web's scoreAssessment so
 * fit is computed identically — no duplicated scoring logic, just the read
 * boilerplate. Service-role reads, scoped to the org resolved from the JWT.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { scoreAssessment, type ScoredItem, type OverallFit } from "@/lib/assessment/scoring";

export interface MobileCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  submittedAt: string;
  fit: OverallFit | null;
  decision: string | null;
}

export async function listScoredCandidates(orgId: string): Promise<MobileCandidate[]> {
  const supa = adminClient();
  const { data: apps } = await supa
    .from("applications")
    .select("id, first_name, last_name, email, positions, status, submitted_at, decision")
    .eq("org_id", orgId)
    .order("submitted_at", { ascending: false })
    .limit(200);
  const applications =
    (apps as {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      positions: string[] | null;
      status: string;
      submitted_at: string;
      decision: string | null;
    }[] | null) ?? [];

  const fit = await fitByApplication(orgId);

  return applications.map((a) => ({
    id: a.id,
    firstName: a.first_name,
    lastName: a.last_name,
    email: a.email,
    role: a.positions?.[0] ?? "—",
    status: a.status,
    submittedAt: a.submitted_at,
    fit: fit.get(a.id) ?? null,
    decision: a.decision,
  }));
}

/** Overall fit per application — same computation as the web report. */
async function fitByApplication(orgId: string): Promise<Map<string, OverallFit>> {
  const supa = adminClient();
  const { data: sessions } = await supa
    .from("assessment_sessions")
    .select("id, application_id, methodology_version")
    .eq("org_id", orgId)
    .eq("subject_type", "candidate")
    .eq("status", "complete");
  const sess = ((sessions as { id: string; application_id: string | null; methodology_version: string }[] | null) ?? []).filter(
    (s) => s.application_id
  );
  if (sess.length === 0) return new Map();

  const { data: resp } = await supa
    .from("assessment_responses")
    .select("session_id, item_id, item_kind, value_int")
    .in("session_id", sess.map((s) => s.id));
  const responses = (resp as { session_id: string; item_id: string; item_kind: string; value_int: number | null }[] | null) ?? [];

  const versions = [...new Set(sess.map((s) => s.methodology_version))];
  const { data: items } = await supa
    .from("item_bank_items")
    .select("item_id, facet, category_academic, keying")
    .in("version", versions.length ? versions : ["__none__"]);
  const meta = new Map(
    ((items as { item_id: string; facet: string; category_academic: string; keying: string }[] | null) ?? []).map((i) => [
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

  const fit = new Map<string, OverallFit>();
  for (const s of sess) {
    const scored = bySession.get(s.id);
    if (!scored || scored.length === 0) continue;
    fit.set(s.application_id as string, scoreAssessment(scored).overall);
  }
  return fit;
}
