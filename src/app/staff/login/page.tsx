import { notFound } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import { currentEmployee } from "@/lib/staff-auth";
import { redirect } from "next/navigation";
import StaffLoginForm from "@/components/staff/StaffLoginForm";

export default async function StaffLoginPage() {
  const org = await currentOrg();
  if (!org) notFound();
  // Already signed in as an employee? Go straight to the schedule.
  const emp = await currentEmployee(org.id);
  if (emp) redirect("/staff");

  const appleEnabled = process.env.NEXT_PUBLIC_APPLE_SSO_ENABLED === "true";

  return (
    <div className="max-w-sm mx-auto mt-6">
      <h1 className="text-2xl font-black tracking-tight">See your schedule</h1>
      <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1 mb-5">
        Sign in to view your shifts at {org.name}.
      </p>
      <StaffLoginForm appleEnabled={appleEnabled} />
    </div>
  );
}
