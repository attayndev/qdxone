/**
 * Interview invites + the upcoming-interviews list for the mobile app. Reuses
 * the shared mintInterviewInvite (same link the web mints), the same email
 * path, and the web's listUpcomingBookings / cancelBooking — so the booking
 * flow is identical across surfaces. Service-role, scoped to the org from JWT.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { mintInterviewInvite } from "@/lib/scheduling/invitations";
import {
  listUpcomingBookings,
  cancelBooking,
  type UpcomingBooking,
} from "@/lib/scheduling/bookings";
import { sendBookingInvite, orgReplyTo } from "@/lib/email";

export type { UpcomingBooking };

/** Upcoming interviews for the org, soonest first (web's list, reused). */
export function listMobileInterviews(orgId: string): Promise<UpcomingBooking[]> {
  return listUpcomingBookings(orgId);
}

/** Cancel a booking from the app — frees the slot, deletes the event, notifies. */
export async function cancelMobileInterview(
  orgId: string,
  bookingId: string,
  reason?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await cancelBooking(orgId, bookingId, reason);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not cancel." };
  }
}

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
