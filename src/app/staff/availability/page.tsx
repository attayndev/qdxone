import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentOrg } from "@/lib/tenancy";
import { currentEmployee } from "@/lib/staff-auth";
import { listUnavailabilityForEmployee } from "@/lib/availability";
import AvailabilityEditor from "@/components/staff/AvailabilityEditor";

export default async function StaffAvailabilityPage() {
  const org = await currentOrg();
  if (!org) notFound();
  const emp = await currentEmployee(org.id);
  if (!emp) redirect("/staff/login");

  const blocks = await listUnavailabilityForEmployee(org.id, emp.id);

  return (
    <div>
      <Link href="/staff" className="text-sm text-[color:var(--brand-ink-muted)] hover:underline">
        ← My schedule
      </Link>
      <h1 className="text-2xl font-black tracking-tight mt-2">My availability</h1>
      <p className="text-sm text-[color:var(--brand-ink-muted)]">
        Mark the times you can&apos;t work each week. Everything else is treated as available.
      </p>
      <AvailabilityEditor blocks={blocks} />
    </div>
  );
}
