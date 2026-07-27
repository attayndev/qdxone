"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  weekDates,
  addDays,
  shiftHours,
  formatTimeRange,
  hasUnpublishedChanges,
  dayOfWeek,
  dateHasTimeOff,
  type ShiftRow,
  type UnavailBlock,
  type TimeOffRange,
} from "@/lib/shifts-core";
import {
  createShift,
  updateShift,
  deleteShift,
  moveShiftToOpen,
  copyPreviousWeek,
  publishWeek,
} from "@/app/admin/schedule/actions";

interface EmpLite { id: string; name: string; role: string | null }
interface LocLite { id: string; name: string }

const OPEN = "__open__";

function dayLabel(d: string): { wd: string; day: string } {
  const dt = new Date(`${d}T00:00:00`);
  return {
    wd: dt.toLocaleDateString(undefined, { weekday: "short" }),
    day: dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  };
}

interface DialogState {
  shift: ShiftRow | null; // null = creating
  employeeId: string; // "" open / OPEN sentinel handled
  date: string;
  role: string;
  start: string; // HH:MM
  end: string; // HH:MM
  locationId: string;
  notes: string;
}

export default function ScheduleGrid({
  weekStart,
  shifts,
  employees,
  locations,
  roles,
  unavail = {},
  timeOff = {},
  pendingRequests = 0,
}: {
  weekStart: string;
  shifts: ShiftRow[];
  employees: EmpLite[];
  locations: LocLite[];
  roles: string[];
  unavail?: Record<string, UnavailBlock[]>;
  timeOff?: Record<string, TimeOffRange[]>;
  pendingRequests?: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const dates = useMemo(() => weekDates(weekStart), [weekStart]);
  const defaultLoc = locations[0]?.id ?? "";

  // Group shifts by employee/date + hours + publish state.
  const grid = useMemo(() => {
    const byEmpDate = new Map<string, ShiftRow[]>(); // `${empKey}|${date}`
    const weekHours = new Map<string, number>();
    const dayHours = new Map<string, number>();
    let unpublished = 0;
    for (const s of shifts) {
      const empKey = s.employee_id ?? OPEN;
      const k = `${empKey}|${s.shift_date}`;
      if (!byEmpDate.has(k)) byEmpDate.set(k, []);
      byEmpDate.get(k)!.push(s);
      const h = shiftHours(s.start_time, s.end_time);
      weekHours.set(empKey, (weekHours.get(empKey) ?? 0) + h);
      dayHours.set(s.shift_date, (dayHours.get(s.shift_date) ?? 0) + h);
      if (hasUnpublishedChanges(s)) unpublished++;
    }
    return { byEmpDate, weekHours, dayHours, unpublished };
  }, [shifts]);

  const cell = (empKey: string, date: string) =>
    (grid.byEmpDate.get(`${empKey}|${date}`) ?? []).sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );

  function go(anchor: string) {
    router.push(`/admin/schedule?week=${anchor}`);
  }

  function run(
    fn: () => Promise<{ ok: boolean; error?: string; warning?: string }>,
    onOk?: () => void
  ) {
    setError(null);
    setFlash(null);
    start(async () => {
      const res = await fn();
      if (res.ok) {
        onOk?.();
        if (res.warning) setFlash(res.warning);
        router.refresh();
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  function openNew(employeeId: string, date: string) {
    setError(null);
    setDialog({
      shift: null,
      employeeId,
      date,
      role: employees.find((e) => e.id === employeeId)?.role ?? roles[0] ?? "",
      start: "17:00",
      end: "22:00",
      locationId: defaultLoc,
      notes: "",
    });
  }

  function openEdit(s: ShiftRow) {
    setError(null);
    setDialog({
      shift: s,
      employeeId: s.employee_id ?? OPEN,
      date: s.shift_date,
      role: s.role ?? "",
      start: s.start_time.slice(0, 5),
      end: s.end_time.slice(0, 5),
      locationId: s.location_id,
      notes: s.notes ?? "",
    });
  }

  function submitDialog() {
    if (!dialog) return;
    const fd = new FormData();
    if (dialog.shift) fd.set("shift_id", dialog.shift.id);
    fd.set("location_id", dialog.locationId || defaultLoc);
    fd.set("employee_id", dialog.employeeId === OPEN ? "" : dialog.employeeId);
    fd.set("role", dialog.role);
    fd.set("shift_date", dialog.date);
    fd.set("start_time", `${dialog.start}:00`);
    fd.set("end_time", `${dialog.end}:00`);
    fd.set("notes", dialog.notes);
    run(() => (dialog.shift ? updateShift(fd) : createShift(fd)), () => setDialog(null));
  }

  function onDelete() {
    if (!dialog?.shift) return;
    const fd = new FormData();
    fd.set("shift_id", dialog.shift.id);
    run(() => deleteShift(fd), () => setDialog(null));
  }

  function onMoveToOpen() {
    if (!dialog?.shift) return;
    const fd = new FormData();
    fd.set("shift_id", dialog.shift.id);
    run(() => moveShiftToOpen(fd), () => setDialog(null));
  }

  function onCopyWeek() {
    const fd = new FormData();
    fd.set("target_anchor", weekStart);
    run(() => copyPreviousWeek(fd));
  }

  function onPublish() {
    const fd = new FormData();
    fd.set("target_anchor", weekStart);
    setError(null);
    start(async () => {
      const res = await publishWeek(fd);
      if (res.ok) {
        setFlash(
          res.published === 0
            ? "Nothing new to publish."
            : `Published ${res.published} shift${res.published === 1 ? "" : "s"} · notified ${res.notified} employee${res.notified === 1 ? "" : "s"}.`
        );
        router.refresh();
      } else setError(res.error);
    });
  }

  const rangeLabel = `${dayLabel(dates[0]).day} – ${dayLabel(dates[6]).day}, ${dates[6].slice(0, 4)}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-3xl font-black tracking-tight">Schedule</h1>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={() => go(addDays(weekStart, -7))} disabled={pending}>
            ← Prev
          </button>
          <button className="btn-ghost" onClick={() => go(new Date().toISOString().slice(0, 10))} disabled={pending}>
            Today
          </button>
          <button className="btn-ghost" onClick={() => go(addDays(weekStart, 7))} disabled={pending}>
            Next →
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap mt-3">
        <div className="text-lg font-bold">{rangeLabel}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/schedule/requests"
            className={
              "chip " + (pendingRequests > 0 ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-600")
            }
          >
            Requests{pendingRequests > 0 ? ` (${pendingRequests})` : ""}
          </Link>
          <span
            className={
              "chip " +
              (grid.unpublished > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")
            }
          >
            {grid.unpublished > 0 ? `${grid.unpublished} unpublished` : "All published"}
          </span>
          <button className="btn-ghost" onClick={onCopyWeek} disabled={pending}>
            Copy last week
          </button>
          <button className="btn-primary" onClick={onPublish} disabled={pending || grid.unpublished === 0}>
            {pending ? "Working…" : "Publish"}
          </button>
        </div>
      </div>

      {flash && <div className="mt-2 text-sm text-amber-800">{flash}</div>}
      {error && <div className="mt-2 text-sm text-rose-600">{error}</div>}

      {/* Grid */}
      <div className="card mt-4 p-0 overflow-x-auto">
        <table className="w-full border-collapse min-w-[860px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-[color:var(--brand-surface)] z-10 text-left p-3 w-44 border-b border-[color:var(--brand-line)]">
                <span className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">Team</span>
              </th>
              {dates.map((d) => {
                const l = dayLabel(d);
                return (
                  <th key={d} className="p-2 border-b border-l border-[color:var(--brand-line)] align-top">
                    <div className="text-sm font-bold">{l.wd}</div>
                    <div className="text-xs text-[color:var(--brand-ink-muted)]">{l.day}</div>
                    <div className="text-[10px] text-[color:var(--brand-ink-muted)] mt-0.5">
                      {(grid.dayHours.get(d) ?? 0) > 0 ? `${grid.dayHours.get(d)}h` : ""}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Open shifts */}
            <ScheduleRowCells
              label="Open shifts"
              sub={openHoursLabel(grid.weekHours.get(OPEN))}
              highlight
              empKey={OPEN}
              dates={dates}
              cell={cell}
              blocks={[]}
              timeOff={[]}
              onAdd={(d) => openNew(OPEN, d)}
              onEdit={openEdit}
            />
            {employees.map((e) => (
              <ScheduleRowCells
                key={e.id}
                label={e.name}
                sub={`${grid.weekHours.get(e.id) ?? 0}h`}
                empKey={e.id}
                dates={dates}
                cell={cell}
                blocks={unavail[e.id] ?? []}
                timeOff={timeOff[e.id] ?? []}
                onAdd={(d) => openNew(e.id, d)}
                onEdit={openEdit}
              />
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-sm text-[color:var(--brand-ink-muted)]">
                  No employees yet. Hire candidates (they appear under Employees) to schedule them.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/edit dialog */}
      {dialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" onClick={() => setDialog(null)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-extrabold text-lg">{dialog.shift ? "Edit shift" : "Add shift"}</h2>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="col-span-2">
                <label className="label">Who</label>
                <select className="input" value={dialog.employeeId} onChange={(e) => setDialog({ ...dialog, employeeId: e.target.value })}>
                  <option value={OPEN}>Open shift (unassigned)</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Day</label>
                <select className="input" value={dialog.date} onChange={(e) => setDialog({ ...dialog, date: e.target.value })}>
                  {dates.map((d) => {
                    const l = dayLabel(d);
                    return <option key={d} value={d}>{l.wd} {l.day}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={dialog.role} onChange={(e) => setDialog({ ...dialog, role: e.target.value })}>
                  <option value="">—</option>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Start</label>
                <input type="time" className="input" value={dialog.start} onChange={(e) => setDialog({ ...dialog, start: e.target.value })} />
              </div>
              <div>
                <label className="label">End</label>
                <input type="time" className="input" value={dialog.end} onChange={(e) => setDialog({ ...dialog, end: e.target.value })} />
              </div>
              {locations.length > 1 && (
                <div className="col-span-2">
                  <label className="label">Store</label>
                  <select className="input" value={dialog.locationId} onChange={(e) => setDialog({ ...dialog, locationId: e.target.value })}>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className="label">Notes</label>
                <input className="input" value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} placeholder="e.g. opening / prep station" />
              </div>
            </div>
            {error && <div className="mt-2 text-sm text-rose-600">{error}</div>}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <button className="btn-primary" onClick={submitDialog} disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </button>
              {dialog.shift && dialog.employeeId !== OPEN && (
                <button className="btn-ghost" onClick={onMoveToOpen} disabled={pending}>Move to open</button>
              )}
              {dialog.shift && (
                <button className="btn-ghost text-rose-600" onClick={onDelete} disabled={pending}>Delete</button>
              )}
              <button className="btn-ghost ml-auto" onClick={() => setDialog(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function openHoursLabel(h: number | undefined): string {
  return h && h > 0 ? `${h}h open` : "";
}

function ScheduleRowCells({
  label,
  sub,
  empKey,
  dates,
  cell,
  blocks,
  timeOff,
  onAdd,
  onEdit,
  highlight,
}: {
  label: string;
  sub: string;
  empKey: string;
  dates: string[];
  cell: (empKey: string, date: string) => ShiftRow[];
  blocks: UnavailBlock[];
  timeOff: TimeOffRange[];
  onAdd: (date: string) => void;
  onEdit: (s: ShiftRow) => void;
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? "bg-[color:var(--brand-cream)]" : ""}>
      <td className={"sticky left-0 z-10 p-3 w-44 border-b border-[color:var(--brand-line)] " + (highlight ? "bg-[color:var(--brand-cream)]" : "bg-[color:var(--brand-surface)]")}>
        <div className="font-semibold text-sm truncate">{label}</div>
        {sub && <div className="text-xs text-[color:var(--brand-ink-muted)]">{sub}</div>}
      </td>
      {dates.map((d) => {
        const shifts = cell(empKey, d);
        const dayBlocks = blocks.filter((b) => b.day_of_week === dayOfWeek(d));
        const onTimeOff = dateHasTimeOff(d, timeOff);
        return (
          <td key={d} className="p-1 border-b border-l border-[color:var(--brand-line)] align-top min-w-[92px]">
            {onTimeOff && (
              <div className="mb-1 rounded bg-violet-100 text-violet-700 text-[10px] px-1.5 py-0.5 font-semibold">
                🌴 Time off
              </div>
            )}
            {dayBlocks.length > 0 && (
              <div
                className="mb-1 rounded bg-rose-50 text-rose-500 text-[10px] px-1.5 py-0.5"
                title={dayBlocks.map((b) => (b.all_day ? "All day" : formatTimeRange(b.start_time ?? "", b.end_time ?? ""))).join(", ")}
              >
                🚫 {dayBlocks.some((b) => b.all_day) ? "Unavailable" : "Can't work part of day"}
              </div>
            )}
            <div className="space-y-1">
              {shifts.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onEdit(s)}
                  className="w-full text-left rounded-md bg-[color:var(--brand-soft)] hover:bg-[color:var(--brand-blue)]/15 px-2 py-1 text-xs"
                >
                  <div className="font-semibold">{formatTimeRange(s.start_time, s.end_time)}</div>
                  {s.role && <div className="text-[10px] text-[color:var(--brand-ink-muted)] truncate">{s.role}</div>}
                </button>
              ))}
              <button
                onClick={() => onAdd(d)}
                className="w-full text-center text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-blue-600)] text-lg leading-none py-0.5"
                title="Add shift"
              >
                +
              </button>
            </div>
          </td>
        );
      })}
    </tr>
  );
}
