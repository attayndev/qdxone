import { notFound } from "next/navigation";
import { currentOrg, getMembership } from "@/lib/tenancy";
import { googleOAuthConfigured } from "@/lib/calendar-providers/config";
import { listConnectionStatuses } from "@/lib/scheduling/connections";
import { getWeeklySchedule } from "@/lib/scheduling/availability-rules";
import { listInterviewTypes } from "@/lib/scheduling/templates";
import { listUpcomingBookings } from "@/lib/scheduling/bookings";
import { getPrimaryLocation } from "@/lib/locations";
import AvailabilityEditor from "@/components/admin/scheduling/AvailabilityEditor";
import InterviewTypes from "@/components/admin/scheduling/InterviewTypes";
import UpcomingInterviews from "@/components/admin/scheduling/UpcomingInterviews";
import { disconnectCalendar } from "./actions";

interface PageProps {
  searchParams: Promise<{ connected?: string; error?: string }>;
}

const ERRORS: Record<string, string> = {
  not_configured: "Google Calendar isn't set up on this server yet.",
  oauth_state_invalid: "That connect link expired. Please try again.",
  oauth_nonce_mismatch: "Couldn't verify the request. Please try again.",
  access_denied: "You declined access on Google's screen.",
  missing_code: "Google didn't return an authorization code. Please try again.",
  connect_failed: "We couldn't finish connecting. Please try again.",
};

export default async function SchedulingPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const org = await currentOrg();
  if (!org) notFound();
  const m = await getMembership(org.id);
  if (!m) notFound();

  const configured = googleOAuthConfigured();
  const connections = await listConnectionStatuses(org.id, m.user_id);
  const google = connections.find((c) => c.provider === "google" && c.status !== "revoked");
  const isConnected = !!google;

  const [schedule, interviewTypes, primaryLocation, upcoming] = await Promise.all([
    getWeeklySchedule(org.id, m.user_id),
    listInterviewTypes(org.id),
    getPrimaryLocation(org.id),
    listUpcomingBookings(org.id),
  ]);
  // Seed the timezone from the store when no schedule exists yet.
  if (schedule.windows.length === 0 && primaryLocation?.timezone) {
    schedule.timezone = primaryLocation.timezone;
  }

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Calendar</h1>
      <p className="text-[color:var(--brand-ink-muted)] mb-6 max-w-prose">
        Connect your calendar so QDX can read your free/busy times and put
        confirmed interviews on your schedule. We never share what&apos;s on your
        calendar — only whether a time is free.
      </p>

      {sp.connected === "google" && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Google Calendar connected.
        </div>
      )}
      {sp.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {ERRORS[sp.error] ?? "Something went wrong. Please try again."}
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-xl font-bold tracking-tight mb-3">Upcoming interviews</h2>
        <UpcomingInterviews bookings={upcoming} />
      </section>

      <h2 className="text-xl font-bold tracking-tight mb-3">Connection &amp; setup</h2>
      <div className="rounded-xl border border-black/10 bg-white p-5 max-w-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold">Google Calendar</div>
            {google ? (
              <div className="text-sm text-[color:var(--brand-ink-muted)]">
                Connected{google.email ? ` · ${google.email}` : ""}
                {google.status === "expired" && " (needs reconnect)"}
              </div>
            ) : (
              <div className="text-sm text-[color:var(--brand-ink-muted)]">
                Not connected
              </div>
            )}
          </div>

          {google ? (
            <form action={disconnectCalendar.bind(null, "google")}>
              <button
                type="submit"
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5"
              >
                Disconnect
              </button>
            </form>
          ) : configured ? (
            <a href="/admin/scheduling/connect/google" className="btn-primary">
              Connect
            </a>
          ) : (
            <span className="text-sm text-[color:var(--brand-ink-muted)]">
              Unavailable
            </span>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">Your weekly availability</h2>
        <p className="text-sm text-[color:var(--brand-ink-muted)] mb-3 max-w-prose">
          The hours you&apos;re open to interview. Candidates only ever see times
          inside these windows that are also free on your calendar.
        </p>
        <AvailabilityEditor schedule={schedule} />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">Interview types</h2>
        <p className="text-sm text-[color:var(--brand-ink-muted)] mb-3 max-w-prose">
          How you meet candidates — a quick phone screen, an in-person sit-down, a
          video call. You&apos;ll pick one of these when inviting a candidate to book.
        </p>
        <InterviewTypes
          types={interviewTypes}
          calendarConnected={isConnected}
          defaultLocation={primaryLocation?.name ?? null}
        />
      </section>
    </div>
  );
}
