/**
 * Candidate detail + report card for the mobile app. Builds the same report the
 * web candidate page renders (scoreAssessment / screenerProfile / assessValidity
 * + the local crew benchmark) but flattened into a JSON payload the native app
 * renders directly — scoring stays server-side, never duplicated on the client.
 * Service-role reads, scoped to the org resolved from the JWT.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { ATTENTION_CHECKS, orgCategoryAverages } from "@/lib/assessment/session";
import {
  scoreAssessment,
  assessValidity,
  screenerProfile,
  type ScoredItem,
  type OverallFit,
  type Band,
  type FlagTone,
} from "@/lib/assessment/scoring";
import { isDecision } from "@/lib/candidate-decision";
import { listInterviewTypes } from "@/lib/scheduling/templates";
import { getWeeklySchedule } from "@/lib/scheduling/availability-rules";

export interface MobileCandidateDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  submittedAt: string;
  assessmentStatus: string | null;
  decision: string | null;
  decisionReason: string | null;
  decisionAt: string | null;
  interviewTypes: { id: string; name: string; durationMinutes: number }[];
  senderHasAvailability: boolean;
  report: {
    overall: OverallFit;
    stars: number;
    categories: {
      categoryUi: string;
      band: Band;
      crew: string | null;
      facets: { facet: string; band: Band }[];
    }[];
    attitude: { band: Band } | null;
    screener: { label: string; tone: FlagTone }[];
    unreliable: boolean;
    flags: string[];
  } | null;
  application: {
    eligibleToWork: boolean | null;
    postalCode: string | null;
    earliestStart: string | null;
    availability: { day: string; blocks: string[] }[];
    workHistory: { employer: string; role: string; span: string | null }[];
    references: { name: string; contact: string }[];
    customAnswers: { label: string; value: string }[];
  };
}

function crewCompare(mean: number, avg: number): string {
  const d = mean - avg;
  if (d >= 0.3) return "Above your applicants";
  if (d <= -0.3) return "Below your applicants";
  return "About your applicants";
}

export async function getCandidateDetail(
  orgId: string,
  applicationId: string,
  userId?: string
): Promise<MobileCandidateDetail | null> {
  const supa = adminClient();
  const { data: app } = await supa
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!app) return null;
  const a = app as Record<string, unknown> & {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    positions: string[] | null;
    submitted_at: string;
    decision: string | null;
    decision_reason: string | null;
    decision_at: string | null;
  };

  const { data: session } = await supa
    .from("assessment_sessions")
    .select("id, status, methodology_version")
    .eq("application_id", applicationId)
    .eq("subject_type", "candidate")
    .maybeSingle();

  let report: MobileCandidateDetail["report"] = null;
  if (session) {
    const { data: resp } = await supa
      .from("assessment_responses")
      .select("session_id, item_id, item_kind, value_int, response_ms")
      .eq("session_id", session.id);
    const responses =
      (resp as {
        item_id: string;
        item_kind: string;
        value_int: number | null;
        response_ms: number | null;
      }[] | null) ?? [];

    const pIds = responses.filter((r) => r.item_kind === "personality").map((r) => r.item_id);
    const { data: items } = await supa
      .from("item_bank_items")
      .select("item_id, facet, category_academic, category_ui, keying")
      .eq("version", session.methodology_version)
      .in("item_id", pIds.length ? pIds : ["__none__"]);
    type Meta = {
      item_id: string;
      facet: string;
      category_academic: string;
      category_ui: string;
      keying: string;
    };
    const meta = new Map<string, Meta>(((items as Meta[] | null) ?? []).map((i) => [i.item_id, i]));

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

    if (scoredItems.length) {
      const categoryUi: Record<string, string> = {};
      for (const m of meta.values()) categoryUi[m.category_academic] = m.category_ui;
      const score = scoreAssessment(scoredItems, categoryUi);

      if (score.overall !== "Incomplete") {
        const benchmark = await orgCategoryAverages(orgId, session.id);
        const showBench = benchmark.n >= 3;

        // Screener flags.
        const screenerAnswers: Record<string, number | null> = {};
        for (const r of responses.filter((r) => r.item_kind === "screener")) {
          screenerAnswers[r.item_id] = r.value_int;
        }
        const screener = screenerProfile(screenerAnswers);

        // Validity / reliability — same signals as the web report.
        const likert = responses.filter((r) => r.item_kind === "personality" && r.value_int != null);
        const attn = responses.filter((r) => r.item_kind === "attention_check");
        const attnFail = attn.filter(
          (r) => r.value_int !== ATTENTION_CHECKS.find((c) => c.itemId === r.item_id)?.expected
        ).length;
        const fast = responses.filter((r) => r.response_ms != null && r.response_ms < 1500).length;
        const straightLine =
          likert.length > 3 && new Set(likert.map((r) => r.value_int)).size === 1;
        const validity = assessValidity({
          scored: scoredItems,
          attnFail,
          attnTotal: attn.length,
          fastCount: fast,
          straightLine,
        });

        report = {
          overall: score.overall,
          stars: score.stars,
          categories: score.categories.map((c) => ({
            categoryUi: c.categoryUi,
            band: c.band,
            crew:
              showBench && benchmark.averages.has(c.category)
                ? crewCompare(c.mean, benchmark.averages.get(c.category)!)
                : null,
            facets: c.facets.map((f) => ({ facet: f.facet, band: f.band })),
          })),
          attitude: score.attitude ? { band: score.attitude.band } : null,
          screener,
          unreliable: !validity.valid,
          flags: validity.reasons,
        };
      }
    }
  }

  const interviewTypes = (await listInterviewTypes(orgId)).map((t) => ({
    id: t.id,
    name: t.name,
    durationMinutes: t.durationMinutes,
  }));

  // The candidate books against the SENDER's calendar — so the invite button is
  // only usable once the current user has set up their own availability.
  const senderHasAvailability = userId
    ? (await getWeeklySchedule(orgId, userId)).windows.length > 0
    : false;

  const availabilityRaw = (a.availability ?? {}) as Record<string, string[]>;
  const availability = Object.entries(availabilityRaw)
    .filter(([, v]) => Array.isArray(v) && v.length)
    .map(([day, blocks]) => ({ day, blocks }));
  const workHistory = ((a.work_history ?? []) as {
    employer: string;
    role: string;
    from?: string;
    to?: string;
    dates?: string;
  }[]).map((j) => ({
    employer: j.employer,
    role: j.role,
    span: [j.from, j.to].filter(Boolean).join(" – ") || j.dates || null,
  }));
  const references = ((a.job_references ?? []) as { name: string; contact: string }[]).map((r) => ({
    name: r.name,
    contact: r.contact,
  }));
  const customAnswers = ((a.custom_answers ?? []) as { label: string; value: string }[])
    .filter((c) => c.value)
    .map((c) => ({ label: c.label, value: c.value }));

  return {
    id: a.id,
    firstName: a.first_name,
    lastName: a.last_name,
    email: a.email,
    phone: a.phone,
    role: a.positions?.[0] ?? "—",
    submittedAt: a.submitted_at,
    assessmentStatus: session ? (session.status as string) : null,
    decision: isDecision(a.decision) ? a.decision : null,
    decisionReason: a.decision_reason,
    decisionAt: a.decision_at,
    interviewTypes,
    senderHasAvailability,
    report,
    application: {
      eligibleToWork: (a.eligible_to_work as boolean | null) ?? null,
      postalCode: (a.postal_code as string | null) ?? null,
      earliestStart: (a.earliest_start_date as string | null) ?? null,
      availability,
      workHistory,
      references,
      customAnswers,
    },
  };
}

/**
 * Record (or clear) the hiring decision from the app. Mirrors the web's
 * setCandidateDecision: a decision flips status to 'decision_made'; clearing it
 * reverts to 'assessment_complete'. Org + actor come from the verified JWT.
 */
export async function setMobileDecision(input: {
  orgId: string;
  userId: string;
  applicationId: string;
  decision: string | null;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.decision !== null && !isDecision(input.decision)) {
    return { ok: false, error: "Invalid decision." };
  }
  const supa = adminClient();
  const { error } = await supa
    .from("applications")
    // decision columns added in migration 0012 — not in generated types yet.
    .update({
      decision: input.decision,
      decision_reason: input.reason.trim() || null,
      decision_at: input.decision ? new Date().toISOString() : null,
      decided_by: input.decision ? input.userId : null,
      status: input.decision ? "decision_made" : "assessment_complete",
    } as never)
    .eq("id", input.applicationId)
    .eq("org_id", input.orgId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
