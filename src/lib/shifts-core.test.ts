import { describe, it, expect } from "vitest";
import {
  shiftHours,
  isOvernight,
  shiftsOverlap,
  weekStart,
  weekDates,
  addDays,
  hasUnpublishedChanges,
  copyWeekShifts,
  hoursByEmployee,
  hoursByDay,
  type ShiftRow,
} from "./shifts-core";

const shift = (over: Partial<ShiftRow>): ShiftRow => ({
  id: "s",
  org_id: "o",
  location_id: "l",
  employee_id: "e1",
  role: "Team Member",
  shift_date: "2026-08-03",
  start_time: "15:00:00",
  end_time: "18:00:00",
  status: "draft",
  notes: null,
  published_at: null,
  created_by: null,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
  ...over,
});

describe("shift time math", () => {
  it("computes duration, counting overnight into the next day", () => {
    expect(shiftHours("15:00:00", "18:00:00")).toBe(3);
    expect(isOvernight("17:00:00", "01:00:00")).toBe(true);
    expect(shiftHours("17:00:00", "01:00:00")).toBe(8); // 5pm→1am
  });

  it("detects same-employee overlap, including into an overnight shift", () => {
    expect(shiftsOverlap({ start_time: "15:00", end_time: "18:00" }, { start_time: "17:00", end_time: "20:00" })).toBe(true);
    expect(shiftsOverlap({ start_time: "15:00", end_time: "18:00" }, { start_time: "18:00", end_time: "22:00" })).toBe(false); // touching, not overlapping
    expect(shiftsOverlap({ start_time: "20:00", end_time: "02:00" }, { start_time: "23:00", end_time: "23:30" })).toBe(true); // inside the overnight
  });
});

describe("week helpers (Mon→Sun, UTC)", () => {
  it("finds Monday of the week and lists 7 days", () => {
    // 2026-08-05 is a Wednesday
    expect(weekStart("2026-08-05")).toBe("2026-08-03"); // Monday
    expect(weekDates("2026-08-05")).toEqual([
      "2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06",
      "2026-08-07", "2026-08-08", "2026-08-09",
    ]);
  });
  it("addDays crosses month boundaries", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
  });
});

describe("hasUnpublishedChanges", () => {
  it("drafts are always unpublished", () => {
    expect(hasUnpublishedChanges({ status: "draft", published_at: null, updated_at: "2026-08-01T00:00:00Z" })).toBe(true);
  });
  it("published + untouched is clean; edited-since-publish is dirty", () => {
    expect(hasUnpublishedChanges({ status: "published", published_at: "2026-08-02T10:00:00Z", updated_at: "2026-08-02T10:00:00Z" })).toBe(false);
    expect(hasUnpublishedChanges({ status: "published", published_at: "2026-08-02T10:00:00Z", updated_at: "2026-08-02T12:00:00Z" })).toBe(true);
  });
});

describe("copyWeekShifts", () => {
  it("shifts dates forward one week, keeping assignment/role/time", () => {
    const copied = copyWeekShifts([shift({ shift_date: "2026-08-03" })]);
    expect(copied[0].shift_date).toBe("2026-08-10");
    expect(copied[0].employee_id).toBe("e1");
    expect(copied[0].start_time).toBe("15:00:00");
  });
});

describe("hours aggregation", () => {
  const shifts = [
    shift({ employee_id: "e1", shift_date: "2026-08-03", start_time: "15:00", end_time: "18:00" }), // 3h
    shift({ employee_id: "e1", shift_date: "2026-08-04", start_time: "17:00", end_time: "23:00" }), // 6h
    shift({ employee_id: null, shift_date: "2026-08-03", start_time: "18:00", end_time: "22:00" }), // 4h open
  ];
  it("sums per employee (open shifts under 'open')", () => {
    const byEmp = hoursByEmployee(shifts);
    expect(byEmp.get("e1")).toBe(9);
    expect(byEmp.get("open")).toBe(4);
  });
  it("sums per day", () => {
    const byDay = hoursByDay(shifts);
    expect(byDay.get("2026-08-03")).toBe(7); // 3 + 4
    expect(byDay.get("2026-08-04")).toBe(6);
  });
});
