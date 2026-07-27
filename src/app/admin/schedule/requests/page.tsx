import { notFound } from "next/navigation";
import Link from "next/link";
import { currentOrg } from "@/lib/tenancy";
import { pendingTimeOff } from "@/lib/time-off";
import { pendingShiftRequests } from "@/lib/shift-requests";
import TimeOffQueue from "@/components/admin/TimeOffQueue";
import ShiftRequestQueue from "@/components/admin/ShiftRequestQueue";

export default async function RequestsPage() {
  const org = await currentOrg();
  if (!org) notFound();
  const [timeOff, shiftReqs] = await Promise.all([
    pendingTimeOff(org.id),
    pendingShiftRequests(org.id),
  ]);

  return (
    <div>
      <Link href="/admin/schedule" className="text-sm text-[color:var(--brand-ink-muted)] hover:underline">
        ← Schedule
      </Link>
      <h1 className="text-3xl font-black tracking-tight mt-2">Requests</h1>
      <p className="text-[color:var(--brand-ink-muted)]">
        Approve or deny your team&apos;s time-off and shift pickups/drops.
      </p>

      <h2 className="text-lg font-black tracking-tight mt-6">Shift pickups & drops</h2>
      <ShiftRequestQueue items={shiftReqs} />

      <h2 className="text-lg font-black tracking-tight mt-6">Time off</h2>
      <TimeOffQueue items={timeOff} />
    </div>
  );
}
