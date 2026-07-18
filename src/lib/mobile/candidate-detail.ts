/**
 * Candidate detail + report card for the mobile app. Builds the same report the
 * web candidate page renders (scoreAssessment / screenerProfile / assessValidity
 * + the local crew benchmark) but flattened into a JSON payload the native app
 * renders directly — scoring stays server-side, never duplicated on the client.
 * Service-role reads, scoped to the org resolved from the JWT.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { ATTENTION_CHECKS, orgCategoryAverages, gateFitByValidity } from "@/lib/assessment/session";
import {
  scoreAssessment,
  assessValidity,
  screenerProfile,
  type ScoredItem,
  type OverallFit,
  type Band,
  type FlagTone,
} from "@/lib/assessment/scoring";
import { isDecision, decisionReasons } from "@/lib/candidate-decision";
import { listInterviewTypes } from "@/lib/scheduling/templates";
import { getWeeklySchedule } from "@/lib/scheduling/availability-rules";
import { applicationConfig } from "@/lib/application-config";
import {
  evaluateCustomGates,
  fitCapFromGates,
  applyFitCap,
  type GateFinding,
} from "@/lib/custom-question-gates";
import type { OrgBranding } from "@/lib/supabase/types";

const GATE_STARS: Record<OverallFit, number> = {
  "Strong fit": 5,
  Consider: 4,
  Caution: 2,
  "Not recommended": 1,
  Incomplete: 0,
};

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
  decisionNotes: string | null;
  decisionReasonOptions: string[];
  decisionAt: string | null;
  interviewTypes: { id: string; name: string; durationMinutes: number }[];
  senderHasAvailability: boolean;
  gateFindings: { label: string; gate: GateFinding["gate"]; expected: string; answer: string }[];
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
    // decision_notes read via the Record index below (generated types stale).
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

  // Custom-question gates: cap the report fit + surface findings (same as web).
  const { data: orgRow } = await supa
    .from("organizations")
    .select("branding")
    .eq("id", orgId)
    .maybeSingle();
  const orgBranding = (orgRow?.branding ?? null) as OrgBranding | null;
  const gateFindings = evaluateCustomGates(
    applicationConfig(orgBranding).custom_questions,
    (a.custom_answers ?? []) as { id: string; value: string }[]
  );
  if (report && report.overall !== "Incomplete") {
    // Match the list: unreliable session can't headline as Strong/Consider, plus
    // custom-question gate caps. The unreliable flag still explains it in the app.
    let o = gateFitByValidity(report.overall, !report.unreliable);
    o = applyFitCap(o, fitCapFromGates(gateFindings));
    if (o !== report.overall) {
      report.overall = o;
      report.stars = GATE_STARS[o];
    }
  }

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
    decisionNotes: (a.decision_notes as string | null) ?? null,
    decisionReasonOptions: decisionReasons(orgBranding?.decision_reasons),
    decisionAt: a.decision_at,
    interviewTypes,
    senderHasAvailability,
    gateFindings: gateFindings.map((f) => ({
      label: f.label,
      gate: f.gate,
      expected: f.expected,
      answer: f.answer,
    })),
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
  notes?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.decision !== null && !isDecision(input.decision)) {
    return { ok: false, error: "Invalid decision." };
  }
  const supa = adminClient();
  const cleanReason = input.reason.trim();

  // Remember any new reason for the org's dropdown (mirrors the web action).
  if (cleanReason) {
    const { data: orgRow } = await supa
      .from("organizations")
      .select("branding")
      .eq("id", input.orgId)
      .maybeSingle();
    const branding = (orgRow?.branding ?? {}) as { decision_reasons?: string[] };
    const current = branding.decision_reasons ?? [];
    if (!current.some((r) => r.toLowerCase() === cleanReason.toLowerCase())) {
      await supa
        .from("organizations")
        .update({
          branding: { ...branding, decision_reasons: [...current, cleanReason] },
        } as never)
        .eq("id", input.orgId);
    }
  }

  const { error } = await supa
    .from("applications")
    // decision columns added in migrations 0012 (reason) + 0021 (notes) —
    // not in generated types yet.
    .update({
      decision: input.decision,
      decision_reason: cleanReason || null,
      decision_notes: input.notes?.trim() || null,
      decision_at: input.decision ? new Date().toISOString() : null,
      decided_by: input.decision ? input.userId : null,
      status: input.decision ? "decision_made" : "assessment_complete",
    } as never)
    .eq("id", input.applicationId)
    .eq("org_id", input.orgId);
  if (error) return { ok: false, error: error.message };

  // Marking someone HIRED is team-wide news — alert everyone else in the org.
  if (input.decision === "hired") {
    try {
      const [{ data: app }, { data: u }] = await Promise.all([
        supa.from("applications").select("first_name, last_name").eq("id", input.applicationId).maybeSingle(),
        supa.auth.admin.getUserById(input.userId),
      ]);
      const a = app as { first_name: string; last_name: string } | null;
      if (a) {
        const { notifyCandidateHired } = await import("@/lib/operator-notify");
        const { userFullName } = await import("@/lib/user-name");
        await notifyCandidateHired({
          orgId: input.orgId,
          candidateName: `${a.first_name} ${a.last_name}`.trim(),
          applicationId: input.applicationId,
          byUserId: input.userId,
          byName: userFullName(u.user) ?? undefined,
        });
      }
    } catch (e) {
      console.error("hired notify failed", e);
    }
  }
  return { ok: true };
}
