import { notFound, redirect } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import { currentEmployee } from "@/lib/staff-auth";
import Link from "next/link";
import { listEmployeeUpcomingShifts, weekStart, formatTimeRange, shiftHours } from "@/lib/shifts";
import { openShiftsForEmployee, pendingShiftIds } from "@/lib/shift-requests";
import {
  swapTargetsForEmployee,
  incomingSwaps,
  outgoingSwaps,
  activeSwapShiftIds,
} from "@/lib/shift-swaps";
import LogoutButton from "@/components/LogoutButton";
import ShiftRequestButton from "@/components/staff/ShiftRequestButton";
import ShiftSwapButton from "@/components/staff/ShiftSwapButton";
import SwapsSection from "@/components/staff/SwapsSection";

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
  const [shifts, openShifts, pendingDrops, pendingClaims, swapTargets, incoming, outgoing, swapPending] =
    await Promise.all([
      listEmployeeUpcomingShifts(org.id, emp.id, from),
      openShiftsForEmployee(org.id, emp.id),
      pendingShiftIds(org.id, emp.id, "drop"),
      pendingShiftIds(org.id, emp.id, "claim"),
      swapTargetsForEmployee(org.id, emp.id),
      incomingSwaps(org.id, emp.id),
      outgoingSwaps(org.id, emp.id),
      activeSwapShiftIds(org.id, emp.id),
    ]);

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
        <div className="flex items-center gap-3">
          <Link href="/staff/availability" className="text-sm font-semibold text-[color:var(--brand-blue-600)] hover:underline whitespace-nowrap">
            Availability
          </Link>
          <Link href="/staff/time-off" className="text-sm font-semibold text-[color:var(--brand-blue-600)] hover:underline whitespace-nowrap">
            Time off
          </Link>
          <LogoutButton />
        </div>
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
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-[color:var(--brand-ink-muted)] whitespace-nowrap">
                          {shiftHours(s.start_time, s.end_time)}h
                        </span>
                        <ShiftSwapButton
                          fromShiftId={s.id}
                          targets={swapTargets}
                          pending={swapPending.has(s.id)}
                        />
                        <ShiftRequestButton shiftId={s.id} kind="drop" pending={pendingDrops.has(s.id)} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Open shifts to pick up */}
      {openShifts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-black tracking-tight">Open shifts</h2>
          <p className="text-sm text-[color:var(--brand-ink-muted)]">
            Shifts that need coverage. Pick one up — your manager confirms it.
          </p>
          <ul className="mt-3 space-y-1.5">
            {openShifts.map((s) => (
              <li key={s.id} className="card py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{dayHeading(s.shift_date)}</div>
                  <div className="text-sm">
                    {formatTimeRange(s.start_time, s.end_time)}
                    {s.role ? ` · ${s.role}` : ""}
                  </div>
                </div>
                <ShiftRequestButton shiftId={s.id} kind="claim" pending={pendingClaims.has(s.id)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <SwapsSection incoming={incoming} outgoing={outgoing} />
    </div>
  );
}
