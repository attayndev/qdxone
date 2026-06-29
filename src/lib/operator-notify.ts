import { adminClient } from "@/lib/supabase/admin";
import { orgUrl } from "@/lib/tenancy";
import { sendOperatorEmail, orgFrom } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { wantsEmail, wantsSms, type NotifyPrefs } from "@/lib/notify-prefs";

/**
 * Operator notifications (server-side dispatch). Each owner/manager tunes their
 * own noise via org_members.notify_prefs (see migration 0011), independently per
 * channel — they pick which events go to email and which go to text. Email goes
 * to the account email; text goes to the member's saved phone. Pure
 * types/defaults live in lib/notify-prefs.ts. Both channels are best-effort.
 */

type MemberPrefRow = {
  user_id: string;
  notify_prefs: NotifyPrefs | null;
  phone: string | null;
};

async function members(orgId: string): Promise<MemberPrefRow[]> {
  const supa = adminClient();
  const { data } = await supa.from("org_members").select("*").eq("org_id", orgId);
  // notify_prefs/phone added in 0011 — not in the generated types yet.
  return ((data ?? []) as unknown as {
    user_id: string;
    notify_prefs: NotifyPrefs | null;
    phone: string | null;
  }[]).map((m) => ({
    user_id: m.user_id,
    notify_prefs: m.notify_prefs ?? null,
    phone: m.phone ?? null,
  }));
}

/** Resolve account emails for a set of members. */
async function emailsFor(rows: MemberPrefRow[]): Promise<string[]> {
  const supa = adminClient();
  const emails: string[] = [];
  for (const m of rows) {
    const { data } = await supa.auth.admin.getUserById(m.user_id);
    if (data.user?.email) emails.push(data.user.email);
  }
  return emails;
}

async function orgInfo(orgId: string) {
  const supa = adminClient();
  const { data } = await supa
    .from("organizations")
    .select("slug, name")
    .eq("id", orgId)
    .maybeSingle();
  return data;
}

function esc(s: string) {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c);
}

/** Fan one alert out to each member on the channels they chose. */
async function dispatch(args: {
  orgId: string;
  emailMatch: (m: MemberPrefRow) => boolean;
  smsMatch: (m: MemberPrefRow) => boolean;
  email: (org: { name: string }, link: string) => { subject: string; html: string; text: string };
  sms: (org: { name: string }, link: string) => string;
  applicationId: string;
}) {
  const all = await members(args.orgId);
  const emailMembers = all.filter(args.emailMatch);
  const smsMembers = all.filter((m) => !!m.phone && args.smsMatch(m));
  if (emailMembers.length === 0 && smsMembers.length === 0) return;

  const org = await orgInfo(args.orgId);
  if (!org) return;
  const link = orgUrl(org.slug, `/admin/candidates/${args.applicationId}`);

  if (process.env.RESEND_API_KEY && emailMembers.length > 0) {
    const to = await emailsFor(emailMembers);
    if (to.length > 0) {
      const e = args.email(org, link);
      await sendOperatorEmail({ to, from: orgFrom(org.name), ...e });
    }
  }

  const body = args.sms(org, link);
  for (const m of smsMembers) {
    await sendSms(m.phone, body); // best-effort; no-ops if Telnyx unset
  }
}

/** A new application landed (pre-assessment). Quiet by default. */
export async function notifyApplicationReceived(args: {
  orgId: string;
  candidateName: string;
  role: string;
  applicationId: string;
}) {
  await dispatch({
    orgId: args.orgId,
    applicationId: args.applicationId,
    emailMatch: (m) => wantsEmail(m.notify_prefs, "new_application"),
    smsMatch: (m) => wantsSms(m.notify_prefs, "new_application"),
    email: (org, link) => ({
      subject: `New application: ${args.candidateName} — ${args.role}`,
      html: `<p><strong>${esc(args.candidateName)}</strong> applied for <strong>${esc(args.role)}</strong> at ${esc(org.name)}.</p><p><a href="${link}">Open their application →</a></p>`,
      text: `${args.candidateName} applied for ${args.role} at ${org.name}.\n\nOpen: ${link}`,
    }),
    sms: (org, link) => `${org.name}: ${args.candidateName} applied for ${args.role}. ${link}`,
  });
}

/**
 * An assessment finished. Notifies members who want every screened candidate
 * (assessment_done), plus members who only want strong fits when this is one —
 * per channel, one message per member.
 */
export async function notifyAssessmentComplete(args: {
  orgId: string;
  candidateName: string;
  fit: string;
  applicationId: string;
}) {
  const isStrong = args.fit === "Strong fit";
  const star = isStrong ? "⭐ " : "";
  await dispatch({
    orgId: args.orgId,
    applicationId: args.applicationId,
    emailMatch: (m) =>
      wantsEmail(m.notify_prefs, "assessment_done") ||
      (isStrong && wantsEmail(m.notify_prefs, "strong")),
    smsMatch: (m) =>
      wantsSms(m.notify_prefs, "assessment_done") ||
      (isStrong && wantsSms(m.notify_prefs, "strong")),
    email: (org, link) => ({
      subject: `${star}${args.candidateName} finished the assessment — ${args.fit}`,
      html: `<p><strong>${esc(args.candidateName)}</strong> finished the assessment at ${esc(org.name)} and scored <strong>${esc(args.fit)}</strong>.</p><p><a href="${link}">Open their report →</a></p>`,
      text: `${args.candidateName} finished the assessment at ${org.name} and scored ${args.fit}.\n\nOpen their report: ${link}`,
    }),
    sms: (org, link) => `${star}${org.name}: ${args.candidateName} finished the assessment — ${args.fit}. ${link}`,
  });
}
