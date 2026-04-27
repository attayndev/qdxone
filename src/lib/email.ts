/**
 * Lightweight Resend wrapper. Email is optional — when RESEND_API_KEY
 * is unset, all helpers no-op so the app still works with manual link
 * copy.
 *
 * Multi-tenant: invitation/applicant emails carry the org's branding
 * and link to the org's subdomain.
 */
import { Resend } from "resend";
import { orgUrl } from "./tenancy";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM ?? "qdx <careers@qdx.one>";

export async function sendInvitationEmail(args: {
  to: string;
  firstName: string | null;
  token: string;
  orgSlug: string;
  orgName: string;
}) {
  const link = orgUrl(args.orgSlug, `/invite/${args.token}`);
  const greeting = args.firstName ? `Hey ${args.firstName},` : "Hey there,";

  await client().emails.send({
    from: FROM,
    to: args.to,
    subject: `Your invitation — ${args.orgName}`,
    html: `
      <div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:540px;margin:0 auto;color:#1a1530">
        <p style="font-size:18px">${escape(greeting)}</p>
        <p>You've been invited to apply to join the team at <strong>${escape(args.orgName)}</strong>.</p>
        <p>It's a short, honest pre-interview questionnaire — about <strong>5 to 7 minutes</strong>.</p>
        <p style="margin:28px 0">
          <a href="${link}"
             style="background:#ff2d87;color:white;padding:14px 22px;border-radius:9999px;text-decoration:none;font-weight:700;display:inline-block">
            Start your application
          </a>
        </p>
        <p style="font-size:13px;color:#4a4360">Or paste this link into your browser:<br>
          <span style="word-break:break-all">${link}</span>
        </p>
      </div>
    `,
    text: `${greeting}\n\nYou've been invited to apply to ${args.orgName}. It's a short pre-interview questionnaire — about 5 to 7 minutes.\n\nOpen this link to start: ${link}`,
  });
}

export async function sendApplicantConfirmationEmail(args: {
  email: string;
  firstName: string;
  orgName: string;
}) {
  await client().emails.send({
    from: FROM,
    to: args.email,
    subject: `Thanks for applying — ${args.orgName}`,
    html: `
      <div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:540px;margin:0 auto;color:#1a1530">
        <p style="font-size:18px">Hey ${escape(args.firstName)},</p>
        <p>Thanks for taking the time to apply to <strong>${escape(args.orgName)}</strong>. We have your responses.</p>
        <p>The team will review your application personally and reach out if it's a fit.</p>
      </div>
    `,
    text: `Hey ${args.firstName},\n\nThanks for applying to ${args.orgName}. We have your responses. The team will review and reach out if it's a fit.`,
  });
}

export async function sendAdminStrongCandidateEmail(args: {
  orgId: string;
  recommendation: string;
  name: string;
  applicantId: string;
}) {
  // Look up the org's owner email(s) instead of a single env var.
  const { adminClient } = await import("./supabase/admin");
  const supa = adminClient();
  const { data: org } = await supa
    .from("organizations")
    .select("slug, name")
    .eq("id", args.orgId)
    .maybeSingle();
  if (!org) return;

  const { data: owners } = await supa
    .from("org_members")
    .select("user_id")
    .eq("org_id", args.orgId)
    .eq("role", "owner");
  if (!owners || owners.length === 0) return;

  // Resolve owner emails via auth admin
  const emails: string[] = [];
  for (const o of owners) {
    const { data } = await supa.auth.admin.getUserById(o.user_id);
    if (data.user?.email) emails.push(data.user.email);
  }
  if (emails.length === 0) return;

  const link = orgUrl(org.slug, `/admin/applicants/${args.applicantId}`);
  await client().emails.send({
    from: FROM,
    to: emails,
    subject: `Strong candidate: ${args.name}`,
    html: `
      <p>${escape(args.name)} just submitted an application at <strong>${escape(org.name)}</strong> and was scored <strong>Strong Interview</strong>.</p>
      <p><a href="${link}">Open in admin →</a></p>
    `,
    text: `${args.name} just submitted an application at ${org.name} and was scored Strong Interview.\n\nOpen in admin: ${link}`,
  });
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
