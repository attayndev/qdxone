import { adminClient } from "@/lib/supabase/admin";
import { orgUrl } from "@/lib/tenancy";
import { sendOperatorEmail, orgFrom } from "@/lib/email";
import { wantsEmail, type NotifyPrefs } from "@/lib/notify-prefs";

/**
 * Operator notifications (server-side dispatch). Each owner/manager tunes their
 * own noise via org_members.notify_prefs (see migration 0011); this resolves who
 * opted in for an event and emails them. Pure types/defaults live in
 * lib/notify-prefs.ts. (SMS + per-store routing + digest are later phases.)
 */

type MemberPrefRow = { user_id: string; notify_prefs: NotifyPrefs | null };

async function members(orgId: string): Promise<MemberPrefRow[]> {
  const supa = adminClient();
  const { data } = await supa.from("org_members").select("*").eq("org_id", orgId);
  // notify_prefs isn't in the generated types yet (added in 0011) — read loosely.
  return ((data ?? []) as unknown as { user_id: string; notify_prefs: NotifyPrefs | null }[]).map(
    (m) => ({ user_id: m.user_id, notify_prefs: m.notify_prefs ?? null })
  );
}

/** Resolve the email addresses of members who opted into `event` (by their prefs). */
async function recipientEmails(orgId: string, predicate: (m: MemberPrefRow) => boolean): Promise<string[]> {
  const supa = adminClient();
  const opted = (await members(orgId)).filter(predicate);
  const emails: string[] = [];
  for (const m of opted) {
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

/** A new application landed (pre-assessment). Quiet by default. */
export async function notifyApplicationReceived(args: {
  orgId: string;
  candidateName: string;
  role: string;
  applicationId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const to = await recipientEmails(args.orgId, (m) => wantsEmail(m.notify_prefs, "new_application"));
  if (to.length === 0) return;
  const org = await orgInfo(args.orgId);
  if (!org) return;
  const link = orgUrl(org.slug, `/admin/candidates/${args.applicationId}`);
  await sendOperatorEmail({
    to,
    from: orgFrom(org.name),
    subject: `New application: ${args.candidateName} — ${args.role}`,
    html: `<p><strong>${esc(args.candidateName)}</strong> applied for <strong>${esc(args.role)}</strong> at ${esc(org.name)}.</p><p><a href="${link}">Open their application →</a></p>`,
    text: `${args.candidateName} applied for ${args.role} at ${org.name}.\n\nOpen: ${link}`,
  });
}

/**
 * An assessment finished. Notifies members who want every screened candidate
 * (assessment_done), plus members who only want strong fits when this is one —
 * one email per member, no duplicates.
 */
export async function notifyAssessmentComplete(args: {
  orgId: string;
  candidateName: string;
  fit: string;
  applicationId: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const isStrong = args.fit === "Strong fit";
  const to = await recipientEmails(
    args.orgId,
    (m) =>
      wantsEmail(m.notify_prefs, "assessment_done") ||
      (isStrong && wantsEmail(m.notify_prefs, "strong"))
  );
  if (to.length === 0) return;
  const org = await orgInfo(args.orgId);
  if (!org) return;
  const link = orgUrl(org.slug, `/admin/candidates/${args.applicationId}`);
  const star = isStrong ? "⭐ " : "";
  await sendOperatorEmail({
    to,
    from: orgFrom(org.name),
    subject: `${star}${args.candidateName} finished the assessment — ${args.fit}`,
    html: `<p><strong>${esc(args.candidateName)}</strong> finished the assessment at ${esc(org.name)} and scored <strong>${esc(args.fit)}</strong>.</p><p><a href="${link}">Open their report →</a></p>`,
    text: `${args.candidateName} finished the assessment at ${org.name} and scored ${args.fit}.\n\nOpen their report: ${link}`,
  });
}
