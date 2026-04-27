"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { lookupInvitation } from "@/lib/invitations";
import { scoreAnswers } from "@/lib/questionnaire/scoring";
import { currentOrgOrThrow } from "@/lib/tenancy";
import { recordUsage } from "@/lib/usage";

const ContactSchema = z.object({
  first_name: z.string().min(1, "Required").max(80),
  last_name: z.string().min(1, "Required").max(80),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().nullable(),
});

const SubmissionSchema = z.object({
  contact: ContactSchema,
  answers: z.record(z.string(), z.unknown()),
});

export type SubmissionInput = z.infer<typeof SubmissionSchema>;

export async function submitApplication(
  token: string,
  input: SubmissionInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const org = await currentOrgOrThrow();
  const lookup = await lookupInvitation(token, org.id);
  if (!lookup.ok) {
    return { ok: false, error: "Invitation is no longer valid." };
  }
  const parsed = SubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Some answers were missing or invalid." };
  }

  const { contact, answers } = parsed.data;
  const scoring = scoreAnswers(answers);
  const supa = adminClient();

  const { data: applicant, error: aerr } = await supa
    .from("applicants")
    .insert({
      org_id: org.id,
      invitation_id: lookup.invitation.id,
      first_name: contact.first_name.trim(),
      last_name: contact.last_name.trim(),
      email: contact.email.trim().toLowerCase(),
      phone: contact.phone?.trim() || null,
      age_band: typeof answers.age_band === "string" ? answers.age_band : null,
      total_score: scoring.total,
      recommendation: scoring.recommendation,
      category_scores: scoring.categoryScores as never,
      risk_flags: scoring.riskFlags as never,
    })
    .select("id")
    .single();

  if (aerr || !applicant) {
    console.error("applicant insert failed", aerr);
    return { ok: false, error: "Could not save your application. Try again." };
  }

  const rows = Object.entries(answers).map(([question_key, answer]) => ({
    org_id: org.id,
    applicant_id: applicant.id,
    question_key,
    answer: (answer ?? null) as never,
  }));
  if (rows.length) {
    const { error: rerr } = await supa.from("responses").insert(rows);
    if (rerr) console.error("responses insert failed", rerr);
  }

  await supa
    .from("invitations")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", lookup.invitation.id);

  await supa.from("audit_events").insert({
    org_id: org.id,
    invitation_id: lookup.invitation.id,
    applicant_id: applicant.id,
    kind: "invite.submitted",
  });

  // Meter the usage. recordUsage decides included-vs-overage and (in
  // phase 3) reports overage to Stripe. Errors here don't block the
  // applicant flow.
  try {
    await recordUsage({
      orgId: org.id,
      typeKey: "questionnaire",
      applicantId: applicant.id,
    });
  } catch (e) {
    console.error("usage event failed", e);
  }

  void notifyAdminIfStrong({
    orgId: org.id,
    recommendation: scoring.recommendation,
    name: `${contact.first_name} ${contact.last_name}`,
    applicantId: applicant.id,
  });
  void notifyApplicant({
    orgName: org.name,
    email: contact.email,
    firstName: contact.first_name,
  });

  return { ok: true };
}

export async function submitAndRedirect(
  token: string,
  input: SubmissionInput
): Promise<{ ok: false; error: string } | never> {
  const result = await submitApplication(token, input);
  if (!result.ok) return result;
  redirect(`/apply/${encodeURIComponent(token)}/thank-you`);
}

async function notifyAdminIfStrong(args: {
  orgId: string;
  recommendation: string;
  name: string;
  applicantId: string;
}) {
  if (args.recommendation !== "strong_interview") return;
  if (!process.env.RESEND_API_KEY) return;
  const { sendAdminStrongCandidateEmail } = await import("@/lib/email");
  await sendAdminStrongCandidateEmail(args).catch((e) =>
    console.error("admin alert failed", e)
  );
}

async function notifyApplicant(args: {
  orgName: string;
  email: string;
  firstName: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const { sendApplicantConfirmationEmail } = await import("@/lib/email");
  await sendApplicantConfirmationEmail(args).catch((e) =>
    console.error("applicant email failed", e)
  );
}
