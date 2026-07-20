import { notFound } from "next/navigation";
import Link from "next/link";
import { currentOrg, getMembership } from "@/lib/tenancy";
import { listUpcomingBookings } from "@/lib/scheduling/bookings";
import UpcomingInterviews from "@/components/admin/scheduling/UpcomingInterviews";

/**
 * Scheduled interviews — the daily-use view (mirrors the mobile app's
 * Interviews tab). The one-time setup (availability, interview types, calendar
 * connection) lives on the Calendar page.
 */
export default async function InterviewsPage() {
  const org = await currentOrg();
  if (!org) notFound();
  const m = await getMembership(org.id);
  if (!m) notFound();

  const upcoming = await listUpcomingBookings(org.id);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-black tracking-tight">Interviews</h1>
        <Link
          href="/admin/scheduling"
          className="text-sm font-semibold text-[color:var(--brand-blue-600)] hover:underline whitespace-nowrap"
        >
          Availability &amp; setup →
        </Link>
      </div>
      <p className="text-[color:var(--brand-ink-muted)] mb-6 max-w-prose">
        Every interview a candidate has booked. Invite someone from their
        profile and, once they pick a time, it lands here.
      </p>

      <UpcomingInterviews bookings={upcoming} />
    </div>
  );
}
