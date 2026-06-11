"use server";

import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { generateToken } from "@/lib/invitations";
import { currentOrgOrThrow } from "@/lib/tenancy";
import { getPrimaryLocation } from "@/lib/locations";

const WorkHistory = z.object({
  employer: z.string().max(120),
  role: z.string().max(120),
  dates: z.string().max(80),
});
const Reference = z.object({
  name: z.string().max(120),
  contact: z.string().max(120),
});

const ApplicationSchema = z.object({
  first_name: z.string().min(1, "Required").max(80),
  last_name: z.string().min(1, "Required").max(80),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  eligible_to_work: z.boolean(),
  // day-of-week → ["morning","afternoon","evening"]
  availability: z.record(z.string(), z.array(z.string())).default({}),
  work_history: z.array(WorkHistory).max(2).default([]),
  job_references: z.array(Reference).max(3).default([]),
  earliest_start_date: z.string().max(20).optional().nullable(),
});

export type ApplicationInput = z.infer<typeof ApplicationSchema>;

export async function submitApplication(
  token: string,
  input: ApplicationInput
): Promise<{ ok: true; assessmentToken?: string } | { ok: false; error: string }> {
  const org = await currentOrgOrThrow();
  const supa = adminClient();

  const { data: posting } = await supa
    .from("job_postings")
    .select("id, location_id, title, status")
    .eq("public_token", token)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!posting || posting.status !== "open") {
    return { ok: false, error: "This posting is no longer accepting applications." };
  }

  const parsed = ApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Some answers were missing or invalid." };
  }
  const v = parsed.data;

  // Resolve the location: a single-store posting carries one; a brand-wide
  // posting (location_id null) falls back to the org's primary location.
  let locationId = posting.location_id;
  if (!locationId) {
    const loc = await getPrimaryLocation(org.id);
    locationId = loc?.id ?? null;
  }
  if (!locationId) {
    return { ok: false, error: "This store isn't finished setting up yet." };
  }

  const { data: app, error } = await supa
    .from("applications")
    .insert({
      org_id: org.id,
      location_id: locationId,
      job_posting_id: posting.id,
      entry_source: "job_posting",
      first_name: v.first_name.trim(),
      last_name: v.last_name.trim(),
      email: v.email.trim().toLowerCase(),
      phone: v.phone?.trim() || null,
      postal_code: v.postal_code?.trim() || null,
      eligible_to_work: v.eligible_to_work,
      availability: v.availability,
      work_history: v.work_history,
      job_references: v.job_references,
      positions: [posting.title],
      earliest_start_date: v.earliest_start_date || null,
      status: "new",
      resume_token: generateToken(),
    })
    .select("id")
    .single();

  if (error || !app) {
    console.error("application insert failed", error);
    return { ok: false, error: "Could not submit your application. Try again." };
  }

  await supa.from("audit_log").insert({
    org_id: org.id,
    action: "application.submitted",
    subject_type: "application",
    subject_id: app.id,
    meta: { job_posting_id: posting.id },
  });

  // Fire the assessment: create the session (selects the 30-item form) and
  // return its token so the candidate continues straight into it. Email is
  // best-effort as a resume backup; SMS provider is a follow-up.
  let assessmentToken: string | undefined;
  try {
    const { createCandidateAssessment } = await import("@/lib/assessment/session");
    assessmentToken = await createCandidateAssessment({
      orgId: org.id,
      locationId,
      applicationId: app.id,
    });
    await supa
      .from("applications")
      .update({ status: "assessment_sent" })
      .eq("id", app.id);

    if (process.env.RESEND_API_KEY && assessmentToken) {
      try {
        const { sendAssessmentEmail } = await import("@/lib/email");
        await sendAssessmentEmail({
          to: v.email,
          firstName: v.first_name,
          orgSlug: org.slug,
          orgName: org.name,
          token: assessmentToken,
        });
      } catch (e) {
        console.error("assessment email failed", e);
      }
    }
  } catch (e) {
    console.error("assessment session creation failed", e);
  }

  return { ok: true, assessmentToken };
}
