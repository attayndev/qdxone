import { notFound } from "next/navigation";
import Link from "next/link";
import { currentOrg } from "@/lib/tenancy";
import { pendingTimeOff } from "@/lib/time-off";
import TimeOffQueue from "@/components/admin/TimeOffQueue";

export default async function TimeOffQueuePage() {
  const org = await currentOrg();
  if (!org) notFound();
  const items = await pendingTimeOff(org.id);

  return (
    <div>
      <Link href="/admin/schedule" className="text-sm text-[color:var(--brand-ink-muted)] hover:underline">
        ← Schedule
      </Link>
      <h1 className="text-3xl font-black tracking-tight mt-2">Time-off requests</h1>
      <p className="text-[color:var(--brand-ink-muted)]">
        Approve or deny your team&apos;s time-off. Approved time off shows on the schedule.
      </p>
      <TimeOffQueue items={items} />
    </div>
  );
}
