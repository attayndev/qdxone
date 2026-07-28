import "server-only";
import { adminClient } from "./supabase/admin";
import {
  scoreAssessment,
  assessValidity,
  type Band,
  type OverallFit,
  type ScoredItem,
} from "./assessment/scoring";
import { ATTENTION_CHECKS, gateFitByValidity } from "./assessment/session";

/**
 * An employee's completed-assessment scores, for the employee detail view. Mirrors
 * the candidate-detail scoring (personality items → category bands → overall fit),
 * capped by response validity so an untrustworthy session can't read as Strong.
 * Employees reuse their (shadow) application's assessment session.
 */
export interface EmployeeAssessmentScore {
  overall: OverallFit;
  stars: number;
  reliable: boolean;
  categories: { categoryUi: string; band: Band; mean: number }[];
}

export async function employeeAssessmentScore(
  orgId: string,
  applicationId: string | null
): Promise<EmployeeAssessmentScore | null> {
  if (!applicationId) return null;
  const supa = adminClient();

  const { data: session } = await supa
    .from("assessment_sessions")
    .select("id, methodology_version")
    .eq("org_id", orgId)
    .eq("application_id", applicationId)
    .eq("subject_type", "candidate")
    .maybeSingle();
  const sess = session as { id: string; methodology_version: string } | null;
  if (!sess) return null;

  const { data: resp } = await supa
    .from("assessment_responses")
    .select("item_kind, item_id, value_int, response_ms")
    .eq("session_id", sess.id);
  type Resp = { item_kind: string; item_id: string; value_int: number | null; response_ms: number | null };
  const responses = (resp as Resp[] | null) ?? [];
  if (responses.length === 0) return null;

  const pIds = responses.filter((r) => r.item_kind === "personality").map((r) => r.item_id);
  const { data: items } = await supa
    .from("item_bank_items")
    .select("item_id, facet, category_academic, category_ui, keying")
    .eq("version", sess.methodology_version)
    .in("item_id", pIds.length ? pIds : ["__none__"]);
  type Meta = { item_id: string; facet: string; category_academic: string; category_ui: string; keying: string };
  const meta = new Map<string, Meta>();
  for (const i of (items as Meta[] | null) ?? []) meta.set(i.item_id, i);

  const scoredItems: ScoredItem[] = responses
    .filter((r) => r.item_kind === "personality" && r.value_int != null && meta.has(r.item_id))
    .map((r) => {
      const m = meta.get(r.item_id)!;
      return {
        value: r.value_int as number,
        facet: m.facet,
        category: m.category_academic,
        keying: (m.keying === "reverse" ? "reverse" : "positive") as "positive" | "reverse",
      };
    });
  if (scoredItems.length === 0) return null;

  const categoryUi: Record<string, string> = {};
  for (const m of meta.values()) categoryUi[m.category_academic] = m.category_ui;
  const score = scoreAssessment(scoredItems, categoryUi);

  // Validity gate — same inputs as the candidate page, so the fit matches.
  const likert = responses.filter((r) => r.item_kind === "personality" && r.value_int != null);
  const attn = responses.filter((r) => r.item_kind === "attention_check");
  const attnFail = attn.filter(
    (r) => r.value_int !== ATTENTION_CHECKS.find((c) => c.itemId === r.item_id)?.expected
  ).length;
  const fast = responses.filter((r) => r.response_ms != null && r.response_ms < 1500).length;
  const straightLine = likert.length > 3 && new Set(likert.map((r) => r.value_int)).size === 1;
  const validity = assessValidity({
    scored: scoredItems,
    attnFail,
    attnTotal: attn.length,
    fastCount: fast,
    straightLine,
  });
  const reliable = validity.valid;

  const overall =
    score.overall === "Incomplete" ? score.overall : gateFitByValidity(score.overall, reliable);

  return {
    overall,
    stars: score.stars,
    reliable,
    categories: score.categories.map((c) => ({
      categoryUi: c.categoryUi,
      band: c.band,
      mean: c.mean,
    })),
  };
}
