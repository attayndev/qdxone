/**
 * Outbox drainer. Processes scheduling_jobs durably: create the calendar event,
 * send the confirmation, send the reminder, cancel the event. The Cloudflare cron
 * calls /api/cron/scheduling, which calls drainJobs(). Each job is claimed
 * (pending→running) before work so a double-fire can't double-process; success →
 * done, failure → failed with the error recorded (and attempts bumped).
 *
 * Ordering: within a cycle, create_event runs before send_confirmation for the
 * same booking, so the confirmation email can carry the Meet link.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { getFreshAccessToken } from "./connections";
import { googleProvider } from "@/lib/calendar-providers/google";
import { orgReplyTo, sendBookingEmail } from "@/lib/email";
import type { MeetingType } from "./types";

const MEETING_LABELS: Record<MeetingType, string> = {
  in_person: "In person",
  phone: "Phone call",
  google_meet: "Google Meet (video)",
  teams: "Microsoft Teams",
  custom_video: "Video call",
  custom_location: "Custom location",
};
const KIND_PRIORITY: Record<string, number> = {
  create_event: 0,
  send_confirmation: 1,
  send_reminder: 2,
  cancel_event: 3,
  reconcile: 4,
};
const MAX_ATTEMPTS = 5;

interface JobRow {
  id: string;
  kind: string;
  booking_id: string | null;
  attempts: number;
}

export interface DrainSummary {
  claimed: number;
  done: number;
  failed: number;
  byKind: Record<string, number>;
}

export async function drainJobs(limit = 25): Promise<DrainSummary> {
  const supa = adminClient();
  const nowIso = new Date().toISOString();
  const { data } = await supa
    .from("scheduling_jobs")
    .select("id, kind, booking_id, attempts")
    .eq("status", "pending")
    .lte("run_after", nowIso)
    .limit(limit);
  const jobs = ((data as JobRow[] | null) ?? []).sort(
    (a, b) => (KIND_PRIORITY[a.kind] ?? 9) - (KIND_PRIORITY[b.kind] ?? 9)
  );

  const summary: DrainSummary = { claimed: 0, done: 0, failed: 0, byKind: {} };
  for (const job of jobs) {
    // Claim: only one drainer wins the pending→running transition.
    const { data: claimed } = await supa
      .from("scheduling_jobs")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ status: "running", attempts: job.attempts + 1 } as any)
      .eq("id", job.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (!claimed) continue;
    summary.claimed++;
    summary.byKind[job.kind] = (summary.byKind[job.kind] ?? 0) + 1;

    try {
      await processJob(job);
      await supa.from("scheduling_jobs").update({ status: "done", last_error: null }).eq("id", job.id);
      summary.done++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const exhausted = job.attempts + 1 >= MAX_ATTEMPTS;
      await supa
        .from("scheduling_jobs")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ status: exhausted ? "failed" : "pending", last_error: msg } as any)
        .eq("id", job.id);
      summary.failed++;
      console.error(`[scheduling-jobs] ${job.kind} ${job.id} failed (attempt ${job.attempts + 1}):`, msg);
    }
  }
  return summary;
}

interface BookingContext {
  booking: {
    id: string;
    org_id: string;
    application_id: string;
    interviewer_id: string;
    start_at: string;
    end_at: string;
    timezone: string;
    status: string;
    meeting_type: MeetingType;
    meeting_location: string | null;
    conference_url: string | null;
    external_calendar_event_id: string | null;
  };
  candidate: { first_name: string; last_name: string; email: string };
  org: { id: string; name: string; slug: string };
  templateName: string;
  instructions: string | null;
}

async function loadContext(bookingId: string): Promise<BookingContext | null> {
  const supa = adminClient();
  const { data: b } = await supa
    .from("interview_bookings")
    .select(
      "id, org_id, application_id, interviewer_id, template_id, start_at, end_at, timezone, status, meeting_type, meeting_location, conference_url, external_calendar_event_id"
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (!b) return null;
  const booking = b as BookingContext["booking"] & { template_id: string | null };

  const [{ data: app }, { data: org }, tmpl] = await Promise.all([
    supa.from("applications").select("first_name, last_name, email").eq("id", booking.application_id).maybeSingle(),
    supa.from("organizations").select("id, name, slug").eq("id", booking.org_id).maybeSingle(),
    booking.template_id
      ? supa.from("interview_templates").select("name, candidate_instructions").eq("id", booking.template_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!app || !org) return null;
  const t = tmpl.data as { name: string; candidate_instructions: string | null } | null;
  return {
    booking,
    candidate: app as BookingContext["candidate"],
    org: org as BookingContext["org"],
    templateName: t?.name ?? "Interview",
    instructions: t?.candidate_instructions ?? null,
  };
}

function whenLabel(startIso: string, tz: string): string {
  const d = new Date(startIso);
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
  return `${date} at ${time}`;
}

async function processJob(job: JobRow): Promise<void> {
  if (!job.booking_id) return; // nothing to do
  const ctx = await loadContext(job.booking_id);
  if (!ctx) throw new Error(`booking ${job.booking_id} not found`);
  if (ctx.booking.status === "cancelled" && job.kind !== "cancel_event") return; // skip stale

  switch (job.kind) {
    case "create_event":
      return createEvent(ctx);
    case "send_confirmation":
      return sendEmail(ctx, "confirmation");
    case "send_reminder":
      return sendEmail(ctx, "reminder");
    case "cancel_event":
      return cancelEvent(ctx);
    default:
      return; // reconcile: no-op for now
  }
}

async function createEvent(ctx: BookingContext): Promise<void> {
  if (ctx.booking.external_calendar_event_id) return; // idempotent
  const supa = adminClient();
  const { data: conn } = await supa
    .from("calendar_connections")
    .select("external_account_id, booking_calendar_id, status")
    .eq("org_id", ctx.booking.org_id)
    .eq("user_id", ctx.booking.interviewer_id)
    .eq("provider", "google")
    .maybeSingle();
  const c = conn as { external_account_id: string | null; booking_calendar_id: string | null; status: string } | null;
  if (!c || c.status === "revoked") {
    // No calendar to write to — booking + emails still stand. Don't fail forever.
    console.warn(`[scheduling-jobs] no calendar connection for interviewer ${ctx.booking.interviewer_id}; skipping event`);
    return;
  }

  const accessToken = await getFreshAccessToken(ctx.booking.org_id, ctx.booking.interviewer_id, "google");
  const attendees = [ctx.candidate.email, c.external_account_id].filter(Boolean) as string[];
  const name = `${ctx.candidate.first_name} ${ctx.candidate.last_name}`.trim();
  const result = await googleProvider.createEvent({
    accessToken,
    calendarId: c.booking_calendar_id ?? "primary",
    start: new Date(ctx.booking.start_at),
    end: new Date(ctx.booking.end_at),
    timezone: ctx.booking.timezone,
    summary: `${ctx.templateName} — ${name}`,
    description: `Interview with ${name} (${ctx.candidate.email}) for ${ctx.org.name}.`,
    location: ctx.booking.meeting_location ?? undefined,
    attendeeEmails: attendees,
    createConference: ctx.booking.meeting_type === "google_meet",
  });

  await supa
    .from("interview_bookings")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({
      external_calendar_provider: "google",
      external_calendar_event_id: result.externalEventId,
      conference_url: result.conferenceUrl ?? null,
    } as any)
    .eq("id", ctx.booking.id);
}

async function sendEmail(ctx: BookingContext, kind: "confirmation" | "reminder"): Promise<void> {
  // Re-read conference_url in case create_event just set it.
  const { data: fresh } = await adminClient()
    .from("interview_bookings")
    .select("conference_url")
    .eq("id", ctx.booking.id)
    .maybeSingle();
  const conferenceUrl = (fresh as { conference_url: string | null } | null)?.conference_url ?? null;

  await sendBookingEmail({
    kind,
    to: ctx.candidate.email,
    firstName: ctx.candidate.first_name,
    orgName: ctx.org.name,
    replyTo: await orgReplyTo(ctx.org.id),
    interviewName: ctx.templateName,
    whenLabel: whenLabel(ctx.booking.start_at, ctx.booking.timezone),
    meetingTypeLabel: MEETING_LABELS[ctx.booking.meeting_type] ?? ctx.booking.meeting_type,
    meetingLocation: ctx.booking.meeting_location,
    conferenceUrl,
    instructions: ctx.instructions,
  });
}

async function cancelEvent(ctx: BookingContext): Promise<void> {
  if (!ctx.booking.external_calendar_event_id) return;
  const supa = adminClient();
  const { data: conn } = await supa
    .from("calendar_connections")
    .select("booking_calendar_id, status")
    .eq("org_id", ctx.booking.org_id)
    .eq("user_id", ctx.booking.interviewer_id)
    .eq("provider", "google")
    .maybeSingle();
  const c = conn as { booking_calendar_id: string | null; status: string } | null;
  if (!c || c.status === "revoked") return;
  const accessToken = await getFreshAccessToken(ctx.booking.org_id, ctx.booking.interviewer_id, "google");
  await googleProvider.deleteEvent({
    accessToken,
    calendarId: c.booking_calendar_id ?? "primary",
    externalEventId: ctx.booking.external_calendar_event_id,
  });
}
