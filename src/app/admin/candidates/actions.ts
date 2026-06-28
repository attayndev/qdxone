"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import { effectiveTier, hasFeature } from "@/lib/plan";
import { isDecision } from "@/lib/candidate-decision";

/**
 * Manager-initiated assessment send (review-first mode). Creates the session
 * and notifies the candidate. No-op if one already exists.
 */
export async function sendAssessmentToCandidate(
  applicationId: string
): Promise<{ ok: boolean; error?: string }> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);
  const supa = adminClient();

  const { data: existing } = await supa
    .from("assessment_sessions")
    .select("id")
    .eq("application_id", applicationId)
    .eq("subject_type", "candidate")
    .maybeSingle();
  if (existing) return { ok: false, error: "Assessment already sent." };

  const { data: app } = await supa
    .from("applications")
    .select("id, location_id, email, first_name, phone, sms_consent")
    .eq("id", applicationId)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!app) return { ok: false, error: "Application not found." };

  const { createCandidateAssessment } = await import("@/lib/assessment/session");
  const token = await createCandidateAssessment({
    orgId: org.id,
    locationId: app.location_id,
    applicationId: app.id,
  });
  await supa
    .from("applications")
    .update({ status: "assessment_sent" })
    .eq("id", app.id);
  await supa.from("audit_log").insert({
    org_id: org.id,
    actor_user_id: m.user_id,
    action: "assessment.sent_manual",
    subject_type: "application",
    subject_id: app.id,
  });

  const { sendAssessmentLink } = await import("@/lib/notify");
  await sendAssessmentLink({
    token,
    orgId: org.id,
    orgSlug: org.slug,
    orgName: org.name,
    firstName: app.first_name,
    email: app.email,
    phone: app.phone,
    // Send SMS only if the candidate consented AND the plan includes SMS.
    smsConsent:
      (app.sms_consent ?? false) &&
      hasFeature(effectiveTier(org), "sms", org.location_count),
  });

  revalidatePath(`/admin/candidates/${applicationId}`);
  revalidatePath("/admin/candidates");
  return { ok: true };
}

/**
 * Delete an application (e.g. a test submission). Cascades its assessment
 * session, responses, and any EEO row. We write an immutable audit entry
 * first so the deletion itself is recorded.
 */
/**
 * Record (or clear) the hiring decision on a candidate. Setting a decision
 * flips status to 'decision_made'; clearing it reverts to 'assessment_complete'.
 */
export async function setCandidateDecision(
  applicationId: string,
  decision: string | null,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);
  if (!m) return { ok: false, error: "Not a member of this org." };
  if (decision !== null && !isDecision(decision)) {
    return { ok: false, error: "Invalid decision." };
  }
  const supa = adminClient();
  await supa
    .from("applications")
    // decision columns added in migration 0012 — not in generated types yet.
    .update({
      decision,
      decision_reason: reason.trim() || null,
      decision_at: decision ? new Date().toISOString() : null,
      decided_by: decision ? m.user_id : null,
      status: decision ? "decision_made" : "assessment_complete",
    } as never)
    .eq("id", applicationId)
    .eq("org_id", org.id);
  revalidatePath(`/admin/candidates/${applicationId}`);
  revalidatePath("/admin/candidates");
  return { ok: true };
}

export async function deleteApplication(id: string) {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);
  const supa = adminClient();

  const { data: app } = await supa
    .from("applications")
    .select("first_name, last_name, email")
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!app) redirect("/admin/candidates");

  await supa.from("audit_log").insert({
    org_id: org.id,
    actor_user_id: m.user_id,
    action: "application.deleted",
    subject_type: "application",
    subject_id: id,
    meta: {
      name: `${app.first_name} ${app.last_name}`,
      email: app.email,
    },
  });

  await supa.from("applications").delete().eq("id", id).eq("org_id", org.id);

  revalidatePath("/admin/candidates");
  redirect("/admin/candidates");
}
