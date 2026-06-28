/**
 * Booking writer. The hard double-booking guarantee is the Postgres exclusion
 * constraint (no two active bookings overlap for one interviewer); this layer
 * re-validates the slot against current availability, writes the booking, and
 * translates a constraint violation into a friendly "just taken" outcome. Async
 * follow-up (calendar event, confirmation email) is enqueued to the outbox —
 * drained by the Stage 6 cron, never inline.
 */

import "server-only";
import { createHash } from "node:crypto";
import { adminClient } from "@/lib/supabase/admin";
import { getWeeklySchedule } from "./availability-rules";
import { getAvailableSlots } from "./slots";
import { markInvitationBooked, type ResolvedInvitation } from "./invitations";

export type BookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; reason: "taken" | "invalid" | "expired" | "error"; message: string };

export async function createBooking(
  inv: ResolvedInvitation,
  startIso: string
): Promise<BookingResult> {
  if (inv.status !== "active") {
    return { ok: false, reason: "expired", message: "This invitation has already been used." };
  }
  if (new Date(inv.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "expired", message: "This invitation has expired." };
  }

  // Re-validate: the chosen start must still be an offered slot.
  const days = await getAvailableSlots(inv.orgId, inv.interviewerId, inv.template);
  const stillOffered = days.some((d) => d.slots.some((s) => s.startIso === startIso));
  if (!stillOffered) {
    return { ok: false, reason: "taken", message: "That time is no longer available. Please pick another." };
  }

  const start = new Date(startIso);
  const end = new Date(start.getTime() + inv.template.durationMinutes * 60_000);
  const schedule = await getWeeklySchedule(inv.orgId, inv.interviewerId);
  const idempotencyKey = createHash("sha256")
    .update(`${inv.id}|${startIso}`)
    .digest("hex");

  const supa = adminClient();
  const { data, error } = await supa
    .from("interview_bookings")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      org_id: inv.orgId,
      invitation_id: inv.id,
      application_id: inv.applicationId,
      template_id: inv.templateId,
      interviewer_id: inv.interviewerId,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      timezone: schedule.timezone,
      status: "confirmed",
      meeting_type: inv.template.meetingType,
      meeting_location: inv.template.meetingLocation,
      idempotency_key: idempotencyKey,
    } as any)
    .select("id")
    .single();

  if (error) {
    // 23P01 exclusion_violation (overlap) / 23505 unique (idempotency or overlap).
    if (error.code === "23P01" || error.code === "23505") {
      return { ok: false, reason: "taken", message: "That time was just booked by someone else. Please pick another." };
    }
    return { ok: false, reason: "error", message: "Could not complete the booking. Please try again." };
  }
  const bookingId = (data as { id: string }).id;

  await markInvitationBooked(inv.id);

  // Enqueue durable follow-up (the cron drains these). Reminder fires 24h before
  // the interview — or right away if it's sooner than that.
  const remindAt = new Date(Math.max(Date.now(), start.getTime() - 24 * 3_600_000)).toISOString();
  await supa
    .from("scheduling_jobs")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert([
      { org_id: inv.orgId, kind: "create_event", booking_id: bookingId },
      { org_id: inv.orgId, kind: "send_confirmation", booking_id: bookingId },
      { org_id: inv.orgId, kind: "send_reminder", booking_id: bookingId, run_after: remindAt },
    ] as any);

  return { ok: true, bookingId };
}
