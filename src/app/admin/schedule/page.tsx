import { notFound } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import { getOrgLocations } from "@/lib/locations";
import { orgRoles } from "@/lib/roles";
import { listEmployees } from "@/lib/employees";
import { listShiftsForWeek, weekStart } from "@/lib/shifts";
import ScheduleGrid from "@/components/admin/ScheduleGrid";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  const org = await currentOrg();
  if (!org) notFound();

  // Anchor week from ?week=YYYY-MM-DD, else the current week (UTC "today").
  const anchor = sp.week && /^\d{4}-\d{2}-\d{2}$/.test(sp.week)
    ? sp.week
    : new Date().toISOString().slice(0, 10);
  const monday = weekStart(anchor);

  const [shifts, employees, locations] = await Promise.all([
    listShiftsForWeek(org.id, monday),
    listEmployees(org.id),
    getOrgLocations(org.id),
  ]);

  return (
    <ScheduleGrid
      weekStart={monday}
      shifts={shifts}
      employees={employees
        .filter((e) => e.employment_status === "employed")
        .map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name}`.trim(), role: e.current_role_name }))}
      locations={locations.map((l) => ({ id: l.id, name: l.name }))}
      roles={orgRoles(org.branding)}
    />
  );
}
