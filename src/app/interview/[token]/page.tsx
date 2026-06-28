import { notFound } from "next/navigation";
import { BrandHeader, BrandFooter } from "@/components/Brand";
import { BrandTheme } from "@/components/BrandTheme";
import { currentOrg } from "@/lib/tenancy";
import { getInvitationByToken } from "@/lib/scheduling/invitations";
import { getAvailableSlots } from "@/lib/scheduling/slots";
import BookingClient from "@/components/interview/BookingClient";
import { bookSlot } from "./actions";

interface PageProps {
  params: Promise<{ token: string }>;
}

const MEETING_LABELS: Record<string, string> = {
  in_person: "In person",
  phone: "Phone call",
  google_meet: "Google Meet (video)",
};

function Shell({
  org,
  children,
}: {
  org: Awaited<ReturnType<typeof currentOrg>>;
  children: React.ReactNode;
}) {
  return (
    <>
      <BrandTheme branding={org?.branding} />
      <BrandHeader org={org} />
      <main className="flex-1 px-4 sm:px-6 py-12">{children}</main>
      <BrandFooter org={org} />
    </>
  );
}

export default async function InterviewBookingPage({ params }: PageProps) {
  const { token } = await params;
  const org = await currentOrg();
  if (!org) notFound();

  const inv = await getInvitationByToken(org.id, token);
  if (!inv) notFound();

  const Card = ({ emoji, title, body }: { emoji: string; title: string; body: string }) => (
    <Shell org={org}>
      <div className="max-w-lg mx-auto card text-center">
        <div className="text-5xl">{emoji}</div>
        <h1 className="mt-3 text-2xl font-black tracking-tight">{title}</h1>
        <p className="mt-3 text-[color:var(--brand-ink-muted)]">{body}</p>
      </div>
    </Shell>
  );

  if (inv.status === "booked") {
    return (
      <Card
        emoji="📅"
        title="You're all set"
        body="This interview is already scheduled. Check your email for the details."
      />
    );
  }
  if (inv.status !== "active" || new Date(inv.expiresAt).getTime() < Date.now()) {
    return (
      <Card
        emoji="⌛"
        title="This link has expired"
        body={`Reach out to ${org.name} and they'll send you a fresh scheduling link.`}
      />
    );
  }

  const days = await getAvailableSlots(inv.orgId, inv.interviewerId, inv.template);
  if (days.length === 0) {
    return (
      <Card
        emoji="🗓️"
        title="No times available right now"
        body={`${org.name} hasn't opened up any interview times yet, or they're all taken. Please check back soon.`}
      />
    );
  }

  const t = inv.template;
  return (
    <Shell org={org}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black tracking-tight">
          Book your interview with {org.name}
        </h1>
        <div className="mt-2 text-[color:var(--brand-ink-muted)]">
          Hi {inv.candidate.firstName} — pick a time that works for you.
        </div>
        <div className="card mt-4 text-sm">
          <div className="font-semibold text-base">{t.name}</div>
          <div className="text-[color:var(--brand-ink-muted)] mt-1">
            {t.durationMinutes} minutes · {MEETING_LABELS[t.meetingType] ?? t.meetingType}
            {t.meetingType === "in_person" && t.meetingLocation ? ` · ${t.meetingLocation}` : ""}
          </div>
          {t.candidateInstructions && (
            <p className="mt-2 text-[color:var(--brand-ink-muted)]">{t.candidateInstructions}</p>
          )}
        </div>

        <BookingClient token={token} days={days} bookSlot={bookSlot} orgName={org.name} />
      </div>
    </Shell>
  );
}
