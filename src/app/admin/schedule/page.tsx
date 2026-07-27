import { notFound } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import { getOrgLocations } from "@/lib/locations";
import { orgRoles } from "@/lib/roles";
import { listEmployees } from "@/lib/employees";
import { listShiftsForWeek, weekStart } from "@/lib/shifts";
import { unavailabilityByEmployee } from "@/lib/availability";
import { approvedTimeOffByEmployee, pendingTimeOffCount } from "@/lib/time-off";
import type { UnavailBlock, TimeOffRange } from "@/lib/shifts-core";
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

  const [shifts, employees, locations, unavailMap, timeOffMap, pendingTO] = await Promise.all([
    listShiftsForWeek(org.id, monday),
    listEmployees(org.id),
    getOrgLocations(org.id),
    unavailabilityByEmployee(org.id),
    approvedTimeOffByEmployee(org.id),
    pendingTimeOffCount(org.id),
  ]);

  // Serialize the maps to plain records for the client grid.
  const unavail: Record<string, UnavailBlock[]> = {};
  for (const [empId, blocks] of unavailMap) {
    unavail[empId] = blocks.map((b) => ({
      day_of_week: b.day_of_week,
      all_day: b.all_day,
      start_time: b.start_time,
      end_time: b.end_time,
    }));
  }
  const timeOff: Record<string, TimeOffRange[]> = {};
  for (const [empId, ranges] of timeOffMap) timeOff[empId] = ranges;

  return (
    <ScheduleGrid
      weekStart={monday}
      shifts={shifts}
      employees={employees
        .filter((e) => e.employment_status === "employed")
        .map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name}`.trim(), role: e.current_role_name }))}
      locations={locations.map((l) => ({ id: l.id, name: l.name }))}
      roles={orgRoles(org.branding)}
      unavail={unavail}
      timeOff={timeOff}
      pendingTimeOff={pendingTO}
    />
  );
}
