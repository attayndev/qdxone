"use server";

import { after } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

type ItemKind = "personality" | "screener" | "attention_check";

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
    .select("id, status")
    .eq("access_token", token)
    .maybeSingle();
  if (!session || session.status === "complete" || session.status === "expired") {
    return { ok: false };
  }

  if (session.status === "sent") {
    await supa
      .from("assessment_sessions")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", session.id);
  }

  await supa.from("assessment_responses").upsert(
    {
      session_id: session.id,
      item_id: r.item_id,
      item_kind: r.item_kind,
      value_int: r.value_int ?? null,
      value_text: r.value_text ?? null,
      response_ms: r.response_ms ?? null,
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
    .select("id, org_id, application_id, status")
    .eq("access_token", token)
    .maybeSingle();
  if (!session) return { ok: false };

  await supa
    .from("assessment_sessions")
    .update({ status: "complete", completed_at: new Date().toISOString() })
    .eq("id", session.id);

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

  // After responding, score it and alert the org's owners if Strong fit.
  after(async () => {
    try {
      const { scoreCandidateSession } = await import("@/lib/assessment/session");
      const result = await scoreCandidateSession(session.id);
      if (result?.overall === "Strong fit" && session.application_id) {
        const { data: appRow } = await supa
          .from("applications")
          .select("first_name, last_name")
          .eq("id", session.application_id)
          .maybeSingle();
        if (appRow) {
          const { sendStrongCandidateAlert } = await import("@/lib/email");
          await sendStrongCandidateAlert({
            orgId: session.org_id,
            name: `${appRow.first_name} ${appRow.last_name}`,
            applicationId: session.application_id,
          });
        }
      }
    } catch (e) {
      console.error("strong-candidate alert failed", e);
    }
  });

  return { ok: true };
}
