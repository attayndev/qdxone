import { adminClient } from "./supabase/admin";
import { listEmployees, type EmployeeView } from "./employees";
import {
  weekDates,
  hoursByEmployee,
  hoursByDay,
  hasUnpublishedChanges,
  type ShiftRow,
} from "./shifts-core";

export * from "./shifts-core";

/** Flat list of shifts in the week containing `anchorDate` (for the grid UI). */
export async function listShiftsForWeek(
  orgId: string,
  anchorDate: string,
  locationId?: string
): Promise<ShiftRow[]> {
  const dates = weekDates(anchorDate);
  const supa = adminClient();
  let query = supa
    .from("shifts")
    .select("*")
    .eq("org_id", orgId)
    .gte("shift_date", dates[0])
    .lte("shift_date", dates[6]);
  if (locationId) query = query.eq("location_id", locationId);
  const { data } = await query;
  return (data as ShiftRow[] | null) ?? [];
}

/** One employee's row in the week grid: their shifts keyed by date. */
export interface ScheduleRow {
  employee: EmployeeView | null; // null = the Open Shifts row
  shiftsByDate: Map<string, ShiftRow[]>;
  weekHours: number;
}

export interface WeekSchedule {
  weekStartDate: string; // Monday
  dates: string[]; // 7 dates, Mon→Sun
  openRow: ScheduleRow; // unassigned shifts
  rows: ScheduleRow[]; // one per employed employee
  hoursByDay: Map<string, number>; // per-date totals
  totalHours: number;
  unpublishedCount: number; // shifts with edits since last publish
}

/** Build the week grid for an org (employees × 7 days + an open-shifts row). */
export async function getWeekSchedule(
  orgId: string,
  anchorDate: string,
  locationId?: string
): Promise<WeekSchedule> {
  const dates = weekDates(anchorDate);
  const supa = adminClient();

  let query = supa
    .from("shifts")
    .select("*")
    .eq("org_id", orgId)
    .gte("shift_date", dates[0])
    .lte("shift_date", dates[6])
    .order("start_time", { ascending: true });
  if (locationId) query = query.eq("location_id", locationId);

  const [{ data }, employees] = await Promise.all([query, listEmployees(orgId)]);
  const shifts = (data as ShiftRow[] | null) ?? [];

  const byEmp = new Map<string, ShiftRow[]>();
  for (const s of shifts) {
    const key = s.employee_id ?? "open";
    if (!byEmp.has(key)) byEmp.set(key, []);
    byEmp.get(key)!.push(s);
  }

  const empHours = hoursByEmployee(shifts);
  const makeRow = (employee: EmployeeView | null, key: string): ScheduleRow => {
    const list = byEmp.get(key) ?? [];
    const shiftsByDate = new Map<string, ShiftRow[]>();
    for (const s of list) {
      if (!shiftsByDate.has(s.shift_date)) shiftsByDate.set(s.shift_date, []);
      shiftsByDate.get(s.shift_date)!.push(s);
    }
    return { employee, shiftsByDate, weekHours: empHours.get(key) ?? 0 };
  };

  const rows = employees
    .filter((e) => e.employment_status === "employed")
    .map((e) => makeRow(e, e.id));

  return {
    weekStartDate: dates[0],
    dates,
    openRow: makeRow(null, "open"),
    rows,
    hoursByDay: hoursByDay(shifts),
    totalHours: [...empHours.values()].reduce((s, h) => s + h, 0),
    unpublishedCount: shifts.filter(hasUnpublishedChanges).length,
  };
}
