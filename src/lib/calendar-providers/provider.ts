/**
 * Calendar-provider abstraction. Google and Microsoft implementations live
 * behind this interface so the scheduling domain never couples to a provider.
 * Implementations are thin raw-`fetch` clients (adapted from CloudMeet — MIT,
 * see THIRD_PARTY_NOTICES.md) that take/return plain objects; all token I/O is
 * server-side and tokens are never returned to callers.
 *
 * v1 ships Google; Microsoft is a fast-follow against this same interface.
 */

export type CalendarProviderId = "google" | "microsoft";

/** A busy interval pulled from the interviewer's calendar (UTC instants). */
export interface BusyPeriod {
  start: Date;
  end: Date;
}

export interface BusyPeriodRequest {
  accessToken: string;
  /** Calendar ids to query; empty = the account's primary/all calendars. */
  calendarIds?: string[];
  timeMin: Date;
  timeMax: Date;
}

export interface CreateCalendarEventRequest {
  accessToken: string;
  calendarId: string;
  start: Date;
  end: Date;
  timezone: string;
  summary: string;
  description: string;
  location?: string;
  attendeeEmails: string[];
  /** Ask the provider to attach a Meet/Teams link. */
  createConference?: boolean;
}

export interface CalendarEventResult {
  externalEventId: string;
  conferenceUrl?: string;
  htmlLink?: string;
}

export interface RefreshConnectionResult {
  accessToken: string;
  /** Provider may rotate the refresh token; persist it when present. */
  refreshToken?: string;
  expiresAt: Date;
}

export interface CalendarProvider {
  readonly id: CalendarProviderId;
  getBusyPeriods(input: BusyPeriodRequest): Promise<BusyPeriod[]>;
  createEvent(input: CreateCalendarEventRequest): Promise<CalendarEventResult>;
  deleteEvent(input: {
    accessToken: string;
    calendarId: string;
    externalEventId: string;
  }): Promise<void>;
  refreshConnection(input: {
    refreshToken: string;
  }): Promise<RefreshConnectionResult>;
}

/** Merge overlapping/adjacent busy intervals (sorted, coalesced). */
export function mergeBusy(periods: BusyPeriod[]): BusyPeriod[] {
  const sorted = [...periods].sort((a, b) => a.start.getTime() - b.start.getTime());
  const out: BusyPeriod[] = [];
  for (const p of sorted) {
    const last = out[out.length - 1];
    if (last && p.start.getTime() <= last.end.getTime()) {
      if (p.end.getTime() > last.end.getTime()) last.end = p.end;
    } else {
      out.push({ start: p.start, end: p.end });
    }
  }
  return out;
}
