/**
 * Interview invites for the mobile app. Reuses the shared mintInterviewInvite
 * (same link the web mints) and the same email path, so the booking flow is
 * identical across surfaces. Service-role, scoped to the org from the JWT.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { mintInterviewInvite } from "@/lib/scheduling/invitations";
import { sendBookingInvite, orgReplyTo } from "@/lib/email";

export type MobileInviteResult =
  | { ok: true; url: string; sentTo: string | null }
  | { ok: false; error: string };

/**
 * Mint a booking link for a candidate; when `email` is true, also send it from
 * the store. Returns the URL (so the app can share it) plus who it was emailed
 * to, if anyone.
 */
export async function createMobileInvite(input: {
  orgId: string;
  userId: string;
  applicationId: string;
  templateId: string;
  email: boolean;
}): Promise<MobileInviteResult> {
  const { data: orgRow } = await adminClient()
    .from("organizations")
    .select("id, slug, name")
    .eq("id", input.orgId)
    .maybeSingle();
  const org = orgRow as { id: string; slug: string; name: string } | null;
  if (!org) return { ok: false, error: "Organization not found." };

  try {
    const inv = await mintInterviewInvite(org, input.userId, input.applicationId, input.templateId);
    if (input.email) {
      if (!inv.application.email) {
        return { ok: false, error: "This candidate has no email on file." };
      }
      await sendBookingInvite({
        to: inv.application.email,
        firstName: inv.application.firstName,
        orgName: inv.orgName,
        replyTo: await orgReplyTo(inv.orgId),
        interviewName: inv.templateName,
        link: inv.url,
      });
      return { ok: true, url: inv.url, sentTo: inv.application.email };
    }
    return { ok: true, url: inv.url, sentTo: null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not create the invite." };
  }
}
