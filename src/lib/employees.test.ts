import { describe, it, expect } from "vitest";
import { nextReviewDue } from "./employees";

describe("nextReviewDue — monthly for first 3 months, then quarterly", () => {
  const hire = new Date("2026-01-15T00:00:00Z");

  it("schedules +1 month at hire (first onboarding check)", () => {
    expect(nextReviewDue(hire, hire)).toBe("2026-02-15");
  });

  it("stays monthly while inside the first 3 months", () => {
    // one month in
    expect(nextReviewDue(new Date("2026-02-15T00:00:00Z"), hire)).toBe("2026-03-15");
    // two months in
    expect(nextReviewDue(new Date("2026-03-15T00:00:00Z"), hire)).toBe("2026-04-15");
  });

  it("switches to quarterly at the 3-month boundary and after", () => {
    // exactly 3 months in → quarterly
    expect(nextReviewDue(new Date("2026-04-15T00:00:00Z"), hire)).toBe("2026-07-15");
    // well past onboarding → quarterly
    expect(nextReviewDue(new Date("2026-07-15T00:00:00Z"), hire)).toBe("2026-10-15");
  });
});
