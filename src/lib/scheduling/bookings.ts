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
import { orgReplyTo, sendBookingCancellation } from "@/lib/email";
import type { MeetingType } from "./types";

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

// ── Owner-facing list + cancel ───────────────────────────────────────────────

export interface UpcomingBooking {
  id: string;
  applicationId: string;
  candidateName: string;
  interviewName: string;
  startAt: string;
  timezone: string;
  meetingType: MeetingType;
  meetingLocation: string | null;
  conferenceUrl: string | null;
  status: string;
}

const ACTIVE_STATUSES = ["confirmed", "calendar_pending", "calendar_failed"];

/** Upcoming (and in-progress) interviews for the org, soonest first. */
export async function listUpcomingBookings(orgId: string): Promise<UpcomingBooking[]> {
  const supa = adminClient();
  const since = new Date(Date.now() - 60 * 60_000).toISOString(); // keep just-started ones
  const { data } = await supa
    .from("interview_bookings")
    .select(
      "id, application_id, template_id, start_at, timezone, meeting_type, meeting_location, conference_url, status"
    )
    .eq("org_id", orgId)
    .in("status", ACTIVE_STATUSES)
    .gte("start_at", since)
    .order("start_at", { ascending: true })
    .limit(100);
  const rows = (data as Array<{
    id: string; application_id: string; template_id: string | null; start_at: string;
    timezone: string; meeting_type: MeetingType; meeting_location: string | null;
    conference_url: string | null; status: string;
  }> | null) ?? [];
  if (rows.length === 0) return [];

  const appIds = [...new Set(rows.map((r) => r.application_id))];
  const tmplIds = [...new Set(rows.map((r) => r.template_id).filter(Boolean) as string[])];
  const [{ data: apps }, { data: tmpls }] = await Promise.all([
    supa.from("applications").select("id, first_name, last_name").in("id", appIds),
    tmplIds.length
      ? supa.from("interview_templates").select("id, name").in("id", tmplIds)
      : Promise.resolve({ data: [] }),
  ]);
  const nameById = new Map((apps as { id: string; first_name: string; last_name: string }[] | null ?? []).map((a) => [a.id, `${a.first_name} ${a.last_name}`.trim()]));
  const tmplById = new Map((tmpls as { id: string; name: string }[] | null ?? []).map((t) => [t.id, t.name]));

  return rows.map((r) => ({
    id: r.id,
    applicationId: r.application_id,
    candidateName: nameById.get(r.application_id) ?? "Candidate",
    interviewName: (r.template_id && tmplById.get(r.template_id)) || "Interview",
    startAt: r.start_at,
    timezone: r.timezone,
    meetingType: r.meeting_type,
    meetingLocation: r.meeting_location,
    conferenceUrl: r.conference_url,
    status: r.status,
  }));
}

/** Cancel a booking: free the slot, delete the calendar event, notify candidate. */
export async function cancelBooking(orgId: string, bookingId: string, reason?: string): Promise<void> {
  const supa = adminClient();
  const { data: bk } = await supa
    .from("interview_bookings")
    .select("id, application_id, template_id, start_at, timezone, status, external_calendar_event_id")
    .eq("org_id", orgId)
    .eq("id", bookingId)
    .maybeSingle();
  const booking = bk as {
    id: string; application_id: string; template_id: string | null; start_at: string;
    timezone: string; status: string; external_calendar_event_id: string | null;
  } | null;
  if (!booking || booking.status === "cancelled") return;

  // Free the slot (excluded from the no-overlap constraint once cancelled).
  await supa
    .from("interview_bookings")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: reason ?? null } as any)
    .eq("id", booking.id);

  // Delete the calendar event via the outbox (needs the prod token key).
  if (booking.external_calendar_event_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supa.from("scheduling_jobs").insert({ org_id: orgId, kind: "cancel_event", booking_id: booking.id } as any);
  }

  // Notify the candidate (branded, from the store).
  const [{ data: app }, { data: org }, tmpl] = await Promise.all([
    supa.from("applications").select("first_name, email").eq("id", booking.application_id).maybeSingle(),
    supa.from("organizations").select("name").eq("id", orgId).maybeSingle(),
    booking.template_id
      ? supa.from("interview_templates").select("name").eq("id", booking.template_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const a = app as { first_name: string; email: string } | null;
  if (a?.email && org) {
    const when = new Intl.DateTimeFormat("en-US", {
      timeZone: booking.timezone, weekday: "long", month: "long", day: "numeric",
      hour: "numeric", minute: "2-digit", timeZoneName: "short",
    }).format(new Date(booking.start_at));
    await sendBookingCancellation({
      to: a.email,
      firstName: a.first_name,
      orgName: (org as { name: string }).name,
      replyTo: await orgReplyTo(orgId),
      interviewName: (tmpl.data as { name: string } | null)?.name ?? "interview",
      whenLabel: when,
    });
  }
}
