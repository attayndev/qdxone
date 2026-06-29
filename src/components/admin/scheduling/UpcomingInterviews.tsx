"use client";

import { useTransition } from "react";
import Link from "next/link";
import { cancelInterview } from "@/app/admin/scheduling/actions";
import type { UpcomingBooking } from "@/lib/scheduling/bookings";

const MEETING_LABELS: Record<string, string> = {
  in_person: "In person",
  phone: "Phone call",
  google_meet: "Google Meet",
  teams: "Teams",
  custom_video: "Video",
  custom_location: "Location",
};

function whenLabel(startIso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(startIso));
}

export default function UpcomingInterviews({ bookings }: { bookings: UpcomingBooking[] }) {
  if (bookings.length === 0) {
    return (
      <p className="text-sm text-[color:var(--brand-ink-muted)]">
        No interviews booked yet. Invite a candidate from their profile and booked
        times will show up here.
      </p>
    );
  }
  return (
    <div className="space-y-2 max-w-2xl">
      {bookings.map((b) => (
        <BookingRow key={b.id} b={b} />
      ))}
    </div>
  );
}

function BookingRow({ b }: { b: UpcomingBooking }) {
  const [pending, start] = useTransition();
  return (
    <div className="card flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-semibold">
          {whenLabel(b.startAt, b.timezone)}
          {b.status === "calendar_failed" && (
            <span className="ml-2 chip bg-amber-100 text-amber-800">calendar sync failed</span>
          )}
        </div>
        <div className="text-sm text-[color:var(--brand-ink-muted)] truncate">
          <Link href={`/admin/candidates/${b.applicationId}`} className="underline">
            {b.candidateName}
          </Link>{" "}
          · {b.interviewName} · {MEETING_LABELS[b.meetingType] ?? b.meetingType}
          {b.conferenceUrl ? (
            <>
              {" · "}
              <a href={b.conferenceUrl} target="_blank" rel="noreferrer" className="underline">
                join link
              </a>
            </>
          ) : b.meetingLocation ? (
            <> · {b.meetingLocation}</>
          ) : null}
        </div>
      </div>
      <button
        disabled={pending}
        onClick={() => {
          if (!confirm(`Cancel the interview with ${b.candidateName}? They'll be notified.`)) return;
          start(() => cancelInterview(b.id));
        }}
        className="rounded-lg border border-red-200 text-red-700 px-3 py-1.5 text-sm font-medium hover:bg-red-50 disabled:opacity-50 shrink-0"
      >
        {pending ? "Cancelling…" : "Cancel"}
      </button>
    </div>
  );
}
