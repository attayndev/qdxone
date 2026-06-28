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
// Bare sending address — must stay our verified domain for deliverability;
// you can't put the operator's address in From without their own domain auth.
const FROM_ADDRESS = (FROM.match(/<([^>]+)>/)?.[1] ?? FROM).trim();

/** A From line that shows the STORE's name but sends on our verified domain. */
export function orgFrom(orgName: string): string {
  return `${orgName} (via QDX) <${FROM_ADDRESS}>`;
}

/**
 * The org's reply-to — its first owner's email — so candidate replies reach the
 * store, not QDX. Best-effort (returns undefined if unresolved).
 */
export async function orgReplyTo(orgId: string): Promise<string | undefined> {
  const { adminClient } = await import("./supabase/admin");
  const supa = adminClient();
  const { data: owner } = await supa
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (!owner) return undefined;
  const { data } = await supa.auth.admin.getUserById(owner.user_id);
  return data.user?.email ?? undefined;
}

/**
 * Generic operator-facing email (notifications). No-ops without RESEND_API_KEY.
 * `to` is a list of operator addresses already resolved + opted-in. Pass `from`
 * (e.g. orgFrom(orgName)) to brand the sender as the store.
 */
export async function sendOperatorEmail(args: {
  to: string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
}) {
  if (!process.env.RESEND_API_KEY || args.to.length === 0) return;
  await client().emails.send({
    from: args.from ?? FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
}


export async function sendAssessmentEmail(args: {
  to: string;
  firstName: string;
  orgSlug: string;
  orgName: string;
  token: string;
  replyTo?: string;
}) {
  const link = orgUrl(args.orgSlug, `/a/${args.token}`);
  await client().emails.send({
    from: orgFrom(args.orgName),
    replyTo: args.replyTo,
    to: args.to,
    subject: `One quick step — your ${args.orgName} assessment`,
    html: `
      <div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:540px;margin:0 auto;color:#1a1530">
        <p style="font-size:18px">Hey ${escape(args.firstName)},</p>
        <p>Thanks for applying to <strong>${escape(args.orgName)}</strong>! There's just one quick step left: a short, five-minute assessment you can complete right from your phone.</p>
        <p style="margin:28px 0">
          <a href="${link}" style="background:#ff2d87;color:white;padding:14px 22px;border-radius:9999px;text-decoration:none;font-weight:700;display:inline-block">
            Start the assessment
          </a>
        </p>
        <p>No need to rush. Take it when you have a few quiet minutes and can give it your full attention.</p>
        <p style="font-size:13px;color:#4a4360">Your link is active for 72 hours. You can also copy and paste it into your browser:<br>
          <span style="word-break:break-all">${link}</span>
        </p>
      </div>
    `,
    text: `Hey ${args.firstName},\n\nThanks for applying to ${args.orgName}! There's just one quick step left: a short, five-minute assessment you can complete right from your phone.\n\nStart the assessment: ${link}\n\nNo need to rush. Take it when you have a few quiet minutes and can give it your full attention.\n\nYour link is active for 72 hours. You can also copy and paste it into your browser:\n${link}`,
  });
}

/**
 * Alert the org's owners when a candidate scores Strong fit. Email only —
 * resolves owner emails via the auth admin API.
 */
export async function sendStrongCandidateAlert(args: {
  orgId: string;
  name: string;
  applicationId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
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

  const emails: string[] = [];
  for (const o of owners) {
    const { data } = await supa.auth.admin.getUserById(o.user_id);
    if (data.user?.email) emails.push(data.user.email);
  }
  if (emails.length === 0) return;

  const link = orgUrl(org.slug, `/admin/candidates/${args.applicationId}`);
  await client().emails.send({
    from: FROM,
    to: emails,
    subject: `⭐ Strong candidate: ${args.name}`,
    html: `
      <p><strong>${escape(args.name)}</strong> just finished the assessment at <strong>${escape(org.name)}</strong> and scored <strong>Strong fit</strong>.</p>
      <p><a href="${link}">Open their report →</a></p>
    `,
    text: `${args.name} just finished the assessment at ${org.name} and scored Strong fit.\n\nOpen their report: ${link}`,
  });
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Interview booking confirmation / reminder, sent to the candidate AS the store
 * (orgFrom + the owner's reply-to). Includes the when, the where (location or
 * the Meet link), and any candidate instructions.
 */
export async function sendBookingEmail(args: {
  kind: "confirmation" | "reminder";
  to: string;
  firstName: string;
  orgName: string;
  replyTo?: string;
  interviewName: string;
  whenLabel: string;
  meetingTypeLabel: string;
  meetingLocation?: string | null;
  conferenceUrl?: string | null;
  instructions?: string | null;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const isReminder = args.kind === "reminder";
  const subject = isReminder
    ? `Reminder: your interview with ${args.orgName} is coming up`
    : `Your interview with ${args.orgName} is booked`;
  const lead = isReminder
    ? `Just a friendly reminder about your upcoming interview with <strong>${escape(args.orgName)}</strong>.`
    : `You're all set! Here are the details for your interview with <strong>${escape(args.orgName)}</strong>.`;

  const where = args.conferenceUrl
    ? `<a href="${args.conferenceUrl}">${escape(args.conferenceUrl)}</a>`
    : args.meetingLocation
      ? escape(args.meetingLocation)
      : escape(args.meetingTypeLabel);

  const rows: [string, string][] = [
    ["What", escape(args.interviewName)],
    ["When", escape(args.whenLabel)],
    ["How", `${escape(args.meetingTypeLabel)}${args.conferenceUrl || args.meetingLocation ? ` — ${where}` : ""}`],
  ];

  await client().emails.send({
    from: orgFrom(args.orgName),
    replyTo: args.replyTo,
    to: args.to,
    subject,
    html: `
      <div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:540px;margin:0 auto;color:#1a1530">
        <p style="font-size:18px">Hi ${escape(args.firstName)},</p>
        <p>${lead}</p>
        <table style="margin:20px 0;border-collapse:collapse">
          ${rows
            .map(
              ([k, v]) =>
                `<tr><td style="padding:6px 16px 6px 0;color:#4a4360;vertical-align:top">${k}</td><td style="padding:6px 0"><strong>${v}</strong></td></tr>`
            )
            .join("")}
        </table>
        ${args.instructions ? `<p style="background:#faf7ff;border-radius:8px;padding:12px 14px">${escape(args.instructions)}</p>` : ""}
        <p style="font-size:13px;color:#4a4360">Need to make a change? Just reply to this email.</p>
      </div>
    `,
    text:
      `Hi ${args.firstName},\n\n${isReminder ? "Reminder about your upcoming interview" : "Your interview is booked"} with ${args.orgName}.\n\n` +
      rows.map(([k, v]) => `${k}: ${v.replace(/<[^>]+>/g, "")}`).join("\n") +
      (args.instructions ? `\n\n${args.instructions}` : "") +
      `\n\nNeed to make a change? Just reply to this email.`,
  });
}
