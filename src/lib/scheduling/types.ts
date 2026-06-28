/**
 * Scheduling domain types — plain shapes mirroring the 0013 migration, kept
 * separate from Supabase's generated row types so the engine and (later) the
 * provider/booking layers depend on intention-revealing names, not DB columns.
 * No I/O here; safe to import from anywhere.
 */

export type CalendarProviderId = "google" | "microsoft";

export type MeetingType =
  | "in_person"
  | "phone"
  | "google_meet"
  | "teams"
  | "custom_video"
  | "custom_location";

export type AssignmentType = "single" | "pool";

export type ConnectionStatus = "connected" | "expired" | "revoked";

export type InvitationStatus = "active" | "booked" | "revoked" | "expired";

export type BookingStatus =
  | "reserving"
  | "confirmed"
  | "calendar_pending"
  | "calendar_failed"
  | "cancelled"
  | "completed"
  | "no_show";

/** Statuses that hold a time slot (must not overlap for one interviewer). */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "reserving",
  "confirmed",
  "calendar_pending",
];

export type SchedulingJobKind =
  | "create_event"
  | "send_confirmation"
  | "send_reminder"
  | "cancel_event"
  | "reconcile";

export interface InterviewTemplate {
  id: string;
  orgId: string;
  jobPostingId: string | null;
  locationId: string | null;
  name: string;
  durationMinutes: number;
  meetingType: MeetingType;
  assignmentType: AssignmentType;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  candidateInstructions: string | null;
  interviewerInstructions: string | null;
  meetingLocation: string | null;
  isActive: boolean;
}

export interface CalendarConnection {
  id: string;
  orgId: string;
  userId: string;
  provider: CalendarProviderId;
  externalAccountId: string | null;
  tokenExpiresAt: Date | null;
  availabilityCalendarId: string | null;
  bookingCalendarId: string | null;
  status: ConnectionStatus;
}

export interface SchedulingInvitation {
  id: string;
  orgId: string;
  applicationId: string;
  jobPostingId: string | null;
  templateId: string;
  assignedInterviewerId: string | null;
  expiresAt: Date;
  status: InvitationStatus;
  maxBookings: number;
}

export interface InterviewBooking {
  id: string;
  orgId: string;
  invitationId: string | null;
  applicationId: string;
  templateId: string | null;
  interviewerId: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  status: BookingStatus;
  meetingType: MeetingType | null;
  meetingLocation: string | null;
  conferenceUrl: string | null;
  externalCalendarProvider: CalendarProviderId | null;
  externalCalendarEventId: string | null;
}
