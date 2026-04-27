import { randomBytes } from "node:crypto";
import { adminClient } from "./supabase/admin";
import type { InvitationRow, InvitationStatus } from "./supabase/types";

/**
 * Generate a URL-safe, hard-to-guess invitation token.
 * 18 random bytes -> ~24 base64url chars. Effectively unguessable.
 */
export function generateToken(): string {
  return randomBytes(18).toString("base64url");
}

/** Default invite lifetime: 30 days */
export const DEFAULT_TTL_DAYS = 30;

export type InvitationLookup =
  | { ok: true; invitation: InvitationRow }
  | { ok: false; reason: "not_found" | "expired" | "submitted" };

/**
 * Server-side check used by the public applicant pages. Uses the
 * service role to read the invitation regardless of RLS.
 *
 * Multi-tenant: an invitation is valid only when its org matches the
 * subdomain the visitor is on. Caller passes `orgId` derived from
 * `currentOrg()`.
 */
export async function lookupInvitation(
  token: string,
  orgId: string
): Promise<InvitationLookup> {
  if (!token || !orgId) return { ok: false, reason: "not_found" };
  const supa = adminClient();
  const { data, error } = await supa
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("org_id", orgId)
    .maybeSingle();
  if (error || !data) return { ok: false, reason: "not_found" };
  const inv = data as InvitationRow;

  if (inv.status === "submitted") return { ok: false, reason: "submitted" };
  if (inv.status === "expired") return { ok: false, reason: "expired" };
  if (inv.expires_at && new Date(inv.expires_at).getTime() < Date.now()) {
    await supa
      .from("invitations")
      .update({ status: "expired" satisfies InvitationStatus })
      .eq("id", inv.id);
    return { ok: false, reason: "expired" };
  }

  return { ok: true, invitation: inv };
}

/**
 * Mark an invitation as opened/started, idempotently. Bumps the status
 * forward without ever moving it backward.
 */
export async function bumpInvitationStatus(
  token: string,
  to: InvitationStatus
): Promise<void> {
  const supa = adminClient();
  const { data: existing } = await supa
    .from("invitations")
    .select("id, org_id, status, opened_at, started_at")
    .eq("token", token)
    .maybeSingle();
  if (!existing) return;

  const order: InvitationStatus[] = [
    "draft",
    "sent",
    "opened",
    "started",
    "submitted",
    "expired",
  ];
  const fromIdx = order.indexOf(existing.status as InvitationStatus);
  const toIdx = order.indexOf(to);
  if (toIdx <= fromIdx) return;

  const patch: { status: InvitationStatus; opened_at?: string; started_at?: string } = {
    status: to,
  };
  if (to === "opened" && !existing.opened_at) patch.opened_at = new Date().toISOString();
  if (to === "started" && !existing.started_at) patch.started_at = new Date().toISOString();

  await supa.from("invitations").update(patch).eq("id", existing.id);
  await supa.from("audit_events").insert({
    org_id: (existing as { org_id?: string }).org_id ?? null,
    invitation_id: existing.id,
    kind: `invite.${to}`,
  });
}
