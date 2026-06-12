import { adminClient } from "@/lib/supabase/admin";
import { generateToken } from "@/lib/tokens";
import {
  buildAssessmentForm,
  DEFAULT_FORM_SPEC_V03,
  type BankItem,
  type Keying,
} from "./form";
import {
  scoreAssessment,
  type ScoredItem,
  type ScoreResult,
  type OverallFit,
} from "./scoring";

/** Pick the methodology version to administer (active, else most recent). */
export async function getActiveMethodologyVersion(): Promise<string> {
  const supa = adminClient();
  const { data } = await supa
    .from("methodology_versions")
    .select("version, status, created_at")
    .order("created_at", { ascending: false });
  const rows = data ?? [];
  return rows.find((r) => r.status === "active")?.version ?? rows[0]?.version ?? "v0.3";
}

/**
 * Create a candidate assessment session: select the fixed 30-question form
 * (28 scored, stratified + exposure-rotated) and persist it with a 72h
 * access token. Returns the token for the /a/<token> link.
 */
export async function createCandidateAssessment(args: {
  orgId: string;
  locationId: string | null;
  applicationId: string;
}): Promise<string> {
  const supa = adminClient();
  const version = await getActiveMethodologyVersion();

  const { data: items } = await supa
    .from("item_bank_items")
    .select("item_id, facet, keying")
    .eq("version", version)
    .eq("item_kind", "personality");
  const bank: BankItem[] = (items ?? []).map((i) => ({
    itemId: i.item_id,
    facet: i.facet,
    keying: i.keying as Keying,
  }));

  // Rotation seed from prior volume → spreads item exposure across candidates.
  const { count } = await supa
    .from("assessment_sessions")
    .select("*", { count: "exact", head: true })
    .eq("org_id", args.orgId)
    .eq("subject_type", "candidate");
  const form = buildAssessmentForm(bank, DEFAULT_FORM_SPEC_V03, {
    rotation: count ?? 0,
  });

  const accessToken = generateToken();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  const { error } = await supa.from("assessment_sessions").insert({
    org_id: args.orgId,
    location_id: args.locationId,
    subject_type: "candidate",
    application_id: args.applicationId,
    methodology_version: version,
    form_item_ids: form.scoredItemIds,
    status: "sent",
    delivery_channels: [],
    access_token: accessToken,
    expires_at: expiresAt,
  });
  if (error) {
    console.error("assessment session insert failed", error);
    throw new Error("Could not create assessment session");
  }
  return accessToken;
}

export type RenderItem =
  | { kind: "likert"; itemId: string; text: string }
  | { kind: "attention"; itemId: string; text: string; expected: number }
  | {
      kind: "screener_single";
      itemId: string;
      question: string;
      options: { value: number; label: string }[];
    }
  | { kind: "screener_text"; itemId: string; question: string };

// Embedded attention checks (delivery layer, not scored facet items).
export const ATTENTION_CHECKS = [
  { itemId: "ATTN-1", text: "Quick check — please choose “Agree” for this one.", expected: 4 },
  { itemId: "ATTN-2", text: "Quick check — please choose “Strongly disagree” for this one.", expected: 1 },
];

export type LoadResult =
  | { status: "ok"; items: RenderItem[]; answered: Record<string, { value_int: number | null; value_text: string | null }> }
  | { status: "complete" | "expired" | "not_found" };

/** Load a session for the taking UI, with the woven item list + saved answers. */
export async function loadAssessment(accessToken: string): Promise<LoadResult> {
  const supa = adminClient();
  const { data: session } = await supa
    .from("assessment_sessions")
    .select("id, status, expires_at, methodology_version, form_item_ids")
    .eq("access_token", accessToken)
    .maybeSingle();
  if (!session) return { status: "not_found" };
  if (session.status === "complete") return { status: "complete" };
  if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
    return { status: "expired" };
  }

  const formIds: string[] = session.form_item_ids ?? [];
  const { data: pItems } = await supa
    .from("item_bank_items")
    .select("item_id, item_text")
    .eq("version", session.methodology_version)
    .in("item_id", formIds.length ? formIds : ["__none__"]);
  const textById = new Map((pItems ?? []).map((i) => [i.item_id, i.item_text]));
  const personality: RenderItem[] = formIds
    .filter((id) => textById.has(id))
    .map((id) => ({ kind: "likert", itemId: id, text: textById.get(id)! }));

  // Weave the two attention checks in at ~1/3 and ~2/3.
  const woven: RenderItem[] = [...personality];
  woven.splice(Math.floor(personality.length / 3), 0, {
    kind: "attention",
    ...ATTENTION_CHECKS[0],
  });
  woven.splice(Math.floor((2 * personality.length) / 3) + 1, 0, {
    kind: "attention",
    ...ATTENTION_CHECKS[1],
  });

  const { data: scr } = await supa
    .from("screener_items")
    .select("item_id, question, format, options, sort_order")
    .eq("version", session.methodology_version)
    .order("sort_order", { ascending: true });
  const screener: RenderItem[] = (scr ?? []).map((s) =>
    s.format === "free_text"
      ? { kind: "screener_text", itemId: s.item_id, question: s.question }
      : {
          kind: "screener_single",
          itemId: s.item_id,
          question: s.question,
          options: (s.options as { value: number; label: string }[] | null) ?? [],
        }
  );

  const { data: resp } = await supa
    .from("assessment_responses")
    .select("item_id, value_int, value_text")
    .eq("session_id", session.id);
  const answered: Record<string, { value_int: number | null; value_text: string | null }> = {};
  for (const r of resp ?? []) {
    answered[r.item_id] = { value_int: r.value_int, value_text: r.value_text };
  }

  return { status: "ok", items: [...woven, ...screener], answered };
}

/** Score a completed candidate session (used for the strong-candidate alert). */
export async function scoreCandidateSession(
  sessionId: string
): Promise<ScoreResult | null> {
  const supa = adminClient();
  const { data: session } = await supa
    .from("assessment_sessions")
    .select("methodology_version")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return null;

  const { data: resp } = await supa
    .from("assessment_responses")
    .select("item_id, item_kind, value_int")
    .eq("session_id", sessionId);
  const { data: items } = await supa
    .from("item_bank_items")
    .select("item_id, facet, category_academic, keying")
    .eq("version", session.methodology_version);
  const meta = new Map((items ?? []).map((i) => [i.item_id, i]));

  const scored: ScoredItem[] = (resp ?? [])
    .filter((r) => r.item_kind === "personality" && r.value_int != null && meta.has(r.item_id))
    .map((r) => {
      const m = meta.get(r.item_id)!;
      return {
        value: r.value_int as number,
        facet: m.facet,
        category: m.category_academic,
        keying: m.keying === "reverse" ? "reverse" : "positive",
      };
    });
  if (scored.length === 0) return null;
  return scoreAssessment(scored);
}

/** Overall fit tier for every completed candidate in an org, by application id. */
export async function orgCandidateTiers(
  orgId: string
): Promise<Map<string, OverallFit>> {
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
  const versions = [...new Set(sess.map((s) => s.methodology_version))];
  const { data: items } = await supa
    .from("item_bank_items")
    .select("item_id, facet, category_academic, keying")
    .in("version", versions.length ? versions : ["__none__"]);
  const meta = new Map((items ?? []).map((i) => [i.item_id, i]));

  const bySession = new Map<string, ScoredItem[]>();
  for (const r of resp ?? []) {
    if (r.item_kind !== "personality" || r.value_int == null) continue;
    const m = meta.get(r.item_id);
    if (!m) continue;
    if (!bySession.has(r.session_id)) bySession.set(r.session_id, []);
    bySession.get(r.session_id)!.push({
      value: r.value_int as number,
      facet: m.facet,
      category: m.category_academic,
      keying: m.keying === "reverse" ? "reverse" : "positive",
    });
  }

  const out = new Map<string, OverallFit>();
  for (const s of sess) {
    const sc = bySession.get(s.id);
    if (!sc || sc.length === 0) continue;
    const result = scoreAssessment(sc);
    if (result.overall !== "Incomplete") out.set(s.application_id as string, result.overall);
  }
  return out;
}
