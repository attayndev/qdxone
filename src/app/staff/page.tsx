import { notFound, redirect } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import { currentEmployee } from "@/lib/staff-auth";
import { listEmployeeUpcomingShifts, weekStart, formatTimeRange, shiftHours } from "@/lib/shifts";
import LogoutButton from "@/components/LogoutButton";

function dayHeading(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default async function StaffSchedulePage() {
  const org = await currentOrg();
  if (!org) notFound();
  const emp = await currentEmployee(org.id);
  if (!emp) redirect("/staff/login");

  const from = weekStart(new Date().toISOString().slice(0, 10));
  const shifts = await listEmployeeUpcomingShifts(org.id, emp.id, from);

  // Group by date.
  const byDate = new Map<string, typeof shifts>();
  for (const s of shifts) {
    if (!byDate.has(s.shift_date)) byDate.set(s.shift_date, []);
    byDate.get(s.shift_date)!.push(s);
  }
  const totalHours = shifts.reduce((sum, s) => sum + shiftHours(s.start_time, s.end_time), 0);

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Hi {emp.first_name} 👋</h1>
          <p className="text-sm text-[color:var(--brand-ink-muted)]">
            Your upcoming shifts at {org.name}.
          </p>
        </div>
        <LogoutButton />
      </div>

      {shifts.length === 0 ? (
        <div className="card mt-5 text-sm text-[color:var(--brand-ink-muted)]">
          No upcoming shifts posted yet. Check back after your manager publishes the schedule.
        </div>
      ) : (
        <>
          <div className="text-xs text-[color:var(--brand-ink-muted)] mt-4">
            {shifts.length} shift{shifts.length === 1 ? "" : "s"} · {totalHours}h scheduled
          </div>
          <div className="mt-3 space-y-4">
            {[...byDate.entries()].map(([date, list]) => (
              <div key={date}>
                <div className="text-sm font-bold">{dayHeading(date)}</div>
                <ul className="mt-1.5 space-y-1.5">
                  {list.map((s) => (
                    <li key={s.id} className="card py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{formatTimeRange(s.start_time, s.end_time)}</div>
                        {s.role && (
                          <div className="text-xs text-[color:var(--brand-ink-muted)]">{s.role}</div>
                        )}
                        {s.notes && (
                          <div className="text-xs text-[color:var(--brand-ink-muted)] mt-0.5">{s.notes}</div>
                        )}
                      </div>
                      <div className="text-xs text-[color:var(--brand-ink-muted)] whitespace-nowrap">
                        {shiftHours(s.start_time, s.end_time)}h
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
