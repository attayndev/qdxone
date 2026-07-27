import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentOrg } from "@/lib/tenancy";
import { currentEmployee } from "@/lib/staff-auth";
import { listTimeOffForEmployee } from "@/lib/time-off";
import TimeOffManager from "@/components/staff/TimeOffManager";

export default async function StaffTimeOffPage() {
  const org = await currentOrg();
  if (!org) notFound();
  const emp = await currentEmployee(org.id);
  if (!emp) redirect("/staff/login");

  const requests = await listTimeOffForEmployee(org.id, emp.id);

  return (
    <div>
      <Link href="/staff" className="text-sm text-[color:var(--brand-ink-muted)] hover:underline">
        ← My schedule
      </Link>
      <h1 className="text-2xl font-black tracking-tight mt-2">Time off</h1>
      <p className="text-sm text-[color:var(--brand-ink-muted)]">
        Request days off. Your manager approves or denies each request.
      </p>
      <TimeOffManager requests={requests} />
    </div>
  );
}
