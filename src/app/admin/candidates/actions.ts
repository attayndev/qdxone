"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";

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
    .select("id, location_id, email, first_name")
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

  if (process.env.RESEND_API_KEY && app.email) {
    try {
      const { sendAssessmentEmail } = await import("@/lib/email");
      await sendAssessmentEmail({
        to: app.email,
        firstName: app.first_name,
        orgSlug: org.slug,
        orgName: org.name,
        token,
      });
    } catch (e) {
      console.error("assessment email failed", e);
    }
  }

  revalidatePath(`/admin/candidates/${applicationId}`);
  revalidatePath("/admin/candidates");
  return { ok: true };
}

/**
 * Delete an application (e.g. a test submission). Cascades its assessment
 * session, responses, and any EEO row. We write an immutable audit entry
 * first so the deletion itself is recorded.
 */
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
