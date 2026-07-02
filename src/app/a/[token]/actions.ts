"use server";

import { after } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { ATTENTION_CHECKS } from "@/lib/assessment/session";

type ItemKind = "personality" | "screener" | "attention_check";
const ITEM_KINDS: ItemKind[] = ["personality", "screener", "attention_check"];

const isExpired = (expiresAt: string | null): boolean =>
  expiresAt != null && new Date(expiresAt).getTime() < Date.now();

/**
 * Save one assessment answer (incremental, so the 72h resume works). Records
 * per-item latency + presentation order for careless-response checks.
 */
export async function saveResponse(
  token: string,
  r: {
    item_id: string;
    item_kind: ItemKind;
    value_int?: number | null;
    value_text?: string | null;
    response_ms?: number | null;
    sequence: number;
  }
): Promise<{ ok: boolean }> {
  const supa = adminClient();
  const { data: session } = await supa
    .from("assessment_sessions")
    .select("id, status, expires_at")
    .eq("access_token", token)
    .maybeSingle();
  if (!session || session.status === "complete" || session.status === "expired") {
    return { ok: false };
  }
  if (isExpired(session.expires_at)) return { ok: false };

  if (session.status === "sent") {
    await supa
      .from("assessment_sessions")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", session.id);
  }

  // Never trust the client's item classification / value range: a known
  // attention-check id is always recorded as such (so it can't be relabeled to
  // dodge the validity gate), unknown kinds fall back to personality, Likert
  // values are clamped to 1–5, and free text / latency are bounded.
  const isKnownAttn = ATTENTION_CHECKS.some((c) => c.itemId === r.item_id);
  const item_kind: ItemKind = isKnownAttn
    ? "attention_check"
    : ITEM_KINDS.includes(r.item_kind)
      ? r.item_kind
      : "personality";
  const value_int = r.value_int == null ? null : Math.max(1, Math.min(5, Math.round(r.value_int)));
  const value_text = r.value_text == null ? null : String(r.value_text).slice(0, 4000);
  const response_ms =
    r.response_ms == null ? null : Math.max(0, Math.min(600_000, Math.round(r.response_ms)));

  await supa.from("assessment_responses").upsert(
    {
      session_id: session.id,
      item_id: r.item_id,
      item_kind,
      value_int,
      value_text,
      response_ms,
      sequence: r.sequence,
    },
    { onConflict: "session_id,item_id" }
  );
  return { ok: true };
}

/** Mark the assessment complete and advance the application's pipeline state. */
export async function completeAssessment(
  token: string
): Promise<{ ok: boolean }> {
  const supa = adminClient();
  const { data: session } = await supa
    .from("assessment_sessions")
    .select("id, org_id, application_id, status, expires_at")
    .eq("access_token", token)
    .maybeSingle();
  if (!session) return { ok: false };
  if (session.status === "complete") return { ok: true }; // already done — idempotent
  if (isExpired(session.expires_at)) return { ok: false };

  // Atomic transition: only the caller that actually flips in_progress→complete
  // proceeds to audit + notify, so a double-submit can't re-fire the operator
  // alert or write duplicate audit rows.
  const { data: flipped } = await supa
    .from("assessment_sessions")
    .update({ status: "complete", completed_at: new Date().toISOString() })
    .eq("id", session.id)
    .neq("status", "complete")
    .select("id");
  if (!flipped || flipped.length === 0) return { ok: true };

  if (session.application_id) {
    await supa
      .from("applications")
      .update({ status: "assessment_complete" })
      .eq("id", session.application_id);
  }

  await supa.from("audit_log").insert({
    org_id: session.org_id,
    action: "assessment.completed",
    subject_type: "assessment_session",
    subject_id: session.id,
  });

  // After responding: score it, then notify the operators who opted in for a
  // finished assessment (or just strong fits) — per their own prefs.
  after(async () => {
    try {
      const { scoreCandidateSession } = await import("@/lib/assessment/session");
      const result = await scoreCandidateSession(session.id);
      if (result?.overall && session.application_id) {
        const { data: appRow } = await supa
          .from("applications")
          .select("first_name, last_name")
          .eq("id", session.application_id)
          .maybeSingle();
        if (appRow) {
          const { notifyAssessmentComplete } = await import("@/lib/operator-notify");
          // Untrustworthy responses (failed attention checks / straight-lined /
          // contradictory) → report "Unreliable" so the strong-candidate alert
          // doesn't fire on gamed data; assessment-done subscribers still hear.
          const fit =
            result.validity && !result.validity.valid ? "Unreliable" : result.overall;
          await notifyAssessmentComplete({
            orgId: session.org_id,
            candidateName: `${appRow.first_name} ${appRow.last_name}`,
            fit,
            applicationId: session.application_id,
          });
        }
      }
    } catch (e) {
      console.error("assessment-complete notify failed", e);
    }
  });

  return { ok: true };
}
