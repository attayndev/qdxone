import "server-only";
import { adminClient } from "./supabase/admin";
import { orgUrl } from "./tenancy";

/**
 * Shared "send an employee a set-password link" logic, used by both the
 * manager Invite action and the self-serve `reset` on /staff/login. Ensures a
 * Supabase auth user for the email, links it to the employee record, and emails
 * a one-time magic link that lands on /staff/set-password.
 */

function likeLiteral(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

async function findOrCreateUser(email: string): Promise<string | null> {
  const admin = adminClient();
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
  if (found) return found.id;
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error || !data?.user) {
    console.error("staff findOrCreateUser failed", error);
    return null;
  }
  return data.user.id;
}

async function sendSetupEmail(to: string, orgName: string, url: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: `Set up your ${orgName} schedule access`,
        html: `<p>You can now see your schedule at <strong>${orgName}</strong>.</p><p>Set your password to get started: <a href="${url}">${url}</a></p><p>After that, sign in anytime with your email and password.</p>`,
        text: `You can now see your schedule at ${orgName}.\n\nSet your password to get started:\n${url}\n\nAfter that, sign in anytime with your email and password.`,
      }),
    });
  } catch (e) {
    console.error("staff setup email failed", e);
  }
}

/**
 * Email an on-roster employee a set-password link. Returns whether the email
 * matched an employee in this org (callers may want the same opaque shape).
 */
export async function sendStaffSetupLink(params: {
  orgId: string;
  orgSlug: string;
  orgName: string;
  email: string;
}): Promise<{ matched: boolean }> {
  const admin = adminClient();
  const email = params.email.trim().toLowerCase();

  const { data: emp } = await admin
    .from("employees")
    .select("id, user_id")
    .eq("org_id", params.orgId)
    .ilike("email", likeLiteral(email))
    .maybeSingle();
  if (!emp) return { matched: false };

  const userId = await findOrCreateUser(email);
  if (!userId) return { matched: true };

  const patch: Record<string, unknown> = { invited_at: new Date().toISOString() };
  if (!(emp as { user_id: string | null }).user_id) patch.user_id = userId;
  await admin.from("employees").update(patch as never).eq("id", (emp as { id: string }).id);

  const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = (link as { properties?: { hashed_token?: string } } | null)?.properties?.hashed_token;
  if (!tokenHash) return { matched: true };

  const url = orgUrl(
    params.orgSlug,
    `/auth/callback?token_hash=${tokenHash}&type=magiclink&next=${encodeURIComponent("/staff/set-password")}`
  );
  await sendSetupEmail(email, params.orgName, url);
  return { matched: true };
}
