import { describe, it, expect } from "vitest";
import { computeSlots, type ComputeSlotsInput } from "./availability";

const TZ = "America/New_York";
// A fixed "now" well before the test dates so min-notice never trips by accident.
const NOW = new Date("2026-06-01T00:00:00Z");

function base(over: Partial<ComputeSlotsInput> = {}): ComputeSlotsInput {
  return {
    date: "2026-06-15", // a Monday
    timezone: TZ,
    rules: [{ dayOfWeek: 1, startMinutes: 9 * 60, endMinutes: 12 * 60, timezone: TZ }],
    overrides: [],
    busy: [],
    durationMinutes: 30,
    slotIncrementMinutes: 30,
    now: NOW,
    ...over,
  };
}

const hhmmInTz = (d: Date, tz: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

describe("computeSlots", () => {
  it("generates back-to-back slots across a 9–12 window", () => {
    const slots = computeSlots(base());
    expect(slots.map((s) => hhmmInTz(s.start, TZ))).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
    ]);
  });

  it("anchors wall-clock times to the interviewer timezone (EDT = UTC-4 in June)", () => {
    const [first] = computeSlots(base());
    expect(first.start.toISOString()).toBe("2026-06-15T13:00:00.000Z"); // 09:00 EDT
  });

  it("returns nothing when there is no rule for that weekday", () => {
    expect(computeSlots(base({ date: "2026-06-16" }))).toEqual([]); // Tuesday
  });

  it("removes slots that collide with a busy period", () => {
    const busy = [
      { start: new Date("2026-06-15T14:00:00Z"), end: new Date("2026-06-15T14:30:00Z") }, // 10:00 EDT
    ];
    const starts = computeSlots(base({ busy })).map((s) => hhmmInTz(s.start, TZ));
    expect(starts).not.toContain("10:00");
    expect(starts).toContain("09:30");
    expect(starts).toContain("10:30");
  });

  it("applies before/after buffers when testing conflicts", () => {
    // A 10:00–10:30 busy block with a 15-min buffer also knocks out 09:30 and 10:30.
    const busy = [
      { start: new Date("2026-06-15T14:00:00Z"), end: new Date("2026-06-15T14:30:00Z") },
    ];
    const starts = computeSlots(
      base({ busy, bufferBeforeMinutes: 15, bufferAfterMinutes: 15 })
    ).map((s) => hhmmInTz(s.start, TZ));
    expect(starts).not.toContain("09:30");
    expect(starts).not.toContain("10:00");
    expect(starts).not.toContain("10:30");
    expect(starts).toContain("09:00");
    expect(starts).toContain("11:00");
  });

  it("drops slots inside the minimum-notice window", () => {
    // now = 2026-06-15 10:00 EDT → only 10:00+ remain once 240-min notice applies.
    const now = new Date("2026-06-15T14:00:00Z");
    const starts = computeSlots(
      base({ now, minNoticeMinutes: 240 })
    ).map((s) => hhmmInTz(s.start, TZ));
    expect(starts).toEqual([]); // window ends 12:00; 14:00+4h is past it
  });

  it("respects the maximum booking horizon", () => {
    const starts = computeSlots(base({ maxAdvanceDays: 1 })); // date is 14 days out
    expect(starts).toEqual([]);
  });

  it("honors a whole-day blackout override", () => {
    const overrides = [{ date: "2026-06-15", isUnavailable: true }];
    expect(computeSlots(base({ overrides }))).toEqual([]);
  });

  it("uses an override window instead of the weekly rule", () => {
    const overrides = [
      { date: "2026-06-15", isUnavailable: false, startMinutes: 13 * 60, endMinutes: 14 * 60 },
    ];
    const starts = computeSlots(base({ overrides })).map((s) => hhmmInTz(s.start, TZ));
    expect(starts).toEqual(["13:00", "13:30"]);
  });

  it("is correct across a spring-forward DST date (clocks jump at 02:00)", () => {
    // 2026-03-08 is the US spring-forward Sunday; a 9:00 ET slot is UTC-4 (EDT).
    const rules = [{ dayOfWeek: 0, startMinutes: 9 * 60, endMinutes: 10 * 60, timezone: TZ }];
    const [first] = computeSlots(
      base({ date: "2026-03-08", rules, now: new Date("2026-03-01T00:00:00Z") })
    );
    expect(first.start.toISOString()).toBe("2026-03-08T13:00:00.000Z"); // 09:00 EDT
  });
});
