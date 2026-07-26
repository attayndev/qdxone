import { describe, it, expect } from "vitest";
import {
  bucketPerformanceByFit,
  bucketPerformanceByDimension,
  MIN_READABLE_N,
} from "./employee-analytics-core";
import type { OverallFit, Band } from "./assessment/scoring";

const emp = (
  id: string,
  application_id: string | null,
  employment_status: "employed" | "terminated"
) => ({ id, application_id, employment_status });

describe("bucketPerformanceByFit", () => {
  it("buckets employees by their application's fit band and averages ratings", () => {
    const fit = new Map<string, OverallFit>([
      ["a1", "Strong fit"],
      ["a2", "Strong fit"],
      ["a3", "Consider"],
    ]);
    const res = bucketPerformanceByFit({
      employees: [
        emp("e1", "a1", "employed"),
        emp("e2", "a2", "employed"),
        emp("e3", "a3", "terminated"),
      ],
      fit,
      avgRatingByEmployee: new Map([
        ["e1", 5],
        ["e2", 4],
        // e3 has no reviews
      ]),
    });
    const strong = res.bands.find((b) => b.band === "Strong fit")!;
    expect(strong.hired).toBe(2);
    expect(strong.reviewed).toBe(2);
    expect(strong.avgRating).toBe(4.5); // (5 + 4) / 2
    expect(strong.retentionPct).toBe(100);

    const consider = res.bands.find((b) => b.band === "Consider")!;
    expect(consider.hired).toBe(1);
    expect(consider.reviewed).toBe(0);
    expect(consider.avgRating).toBeNull(); // no reviews → null, not 0
    expect(consider.retentionPct).toBe(0); // terminated → 0% retention
  });

  it("flags small samples as not readable, larger ones as readable", () => {
    const fit = new Map<string, OverallFit>(
      Array.from({ length: 5 }, (_, i) => [`a${i}`, "Strong fit" as OverallFit])
    );
    const res = bucketPerformanceByFit({
      employees: Array.from({ length: 5 }, (_, i) =>
        emp(`e${i}`, `a${i}`, "employed")
      ),
      fit,
      avgRatingByEmployee: new Map([
        ["e0", 3],
        ["e1", 4],
        ["e2", 5],
      ]), // exactly MIN_READABLE_N=3 reviewed
    });
    const strong = res.bands.find((b) => b.band === "Strong fit")!;
    expect(strong.reviewed).toBe(MIN_READABLE_N);
    expect(strong.readable).toBe(true);
    expect(strong.avgRating).toBe(4);
  });

  it("counts employees with no application/fit as untracked, not in any band", () => {
    const res = bucketPerformanceByFit({
      employees: [emp("e1", null, "employed"), emp("e2", "a2", "employed")],
      fit: new Map<string, OverallFit>([["a2", "Incomplete"]]), // Incomplete is not a band
      avgRatingByEmployee: new Map(),
    });
    expect(res.untrackedFit).toBe(2);
    expect(res.totalHired).toBe(0);
    expect(res.bands.every((b) => b.hired === 0)).toBe(true);
  });

  it("always returns the four bands in order", () => {
    const res = bucketPerformanceByFit({
      employees: [],
      fit: new Map(),
      avgRatingByEmployee: new Map(),
    });
    expect(res.bands.map((b) => b.band)).toEqual([
      "Strong fit",
      "Consider",
      "Caution",
      "Not recommended",
    ]);
  });
});

describe("bucketPerformanceByDimension", () => {
  it("buckets employees by their assessment band on each dimension and averages on-job ratings", () => {
    // Two employees: a1 assessed High on Conscientiousness, a2 assessed Low.
    const categoryBands = new Map<string, Map<string, Band>>([
      ["a1", new Map<string, Band>([["Conscientiousness", "High"]])],
      ["a2", new Map<string, Band>([["Conscientiousness", "Low"]])],
    ]);
    const avgByEmpByCategory = new Map<string, Map<string, number>>([
      ["Conscientiousness", new Map([["e1", 5], ["e2", 2]])],
    ]);
    const dims = bucketPerformanceByDimension({
      employees: [
        { id: "e1", application_id: "a1", employment_status: "employed" },
        { id: "e2", application_id: "a2", employment_status: "employed" },
      ],
      categoryBands,
      avgByEmpByCategory,
    });
    const consc = dims.find((d) => d.academic === "Conscientiousness")!;
    expect(consc.label).toBe("Reliability & Drive");
    const high = consc.bands.find((b) => b.band === "High")!;
    const low = consc.bands.find((b) => b.band === "Low")!;
    expect(high.count).toBe(1);
    expect(high.avgRating).toBe(5); // High assessment band → strong on-job rating
    expect(low.avgRating).toBe(2); // Low band → weak on-job rating (the signal)
  });

  it("returns all four dimensions with High/Mid/Low bands, and null avg when unrated", () => {
    const dims = bucketPerformanceByDimension({
      employees: [{ id: "e1", application_id: "a1", employment_status: "employed" }],
      categoryBands: new Map([["a1", new Map<string, Band>([["Agreeableness", "Mid"]])]]),
      avgByEmpByCategory: new Map(), // no on-job ratings
    });
    expect(dims).toHaveLength(4);
    const agree = dims.find((d) => d.academic === "Agreeableness")!;
    expect(agree.bands.map((b) => b.band)).toEqual(["High", "Mid", "Low"]);
    const mid = agree.bands.find((b) => b.band === "Mid")!;
    expect(mid.count).toBe(1);
    expect(mid.rated).toBe(0);
    expect(mid.avgRating).toBeNull();
  });

  it("excludes employees with no application or no assessment band on that dimension", () => {
    const dims = bucketPerformanceByDimension({
      employees: [
        { id: "e1", application_id: null, employment_status: "employed" },
        { id: "e2", application_id: "a2", employment_status: "employed" }, // no bands
      ],
      categoryBands: new Map([["a2", new Map()]]),
      avgByEmpByCategory: new Map(),
    });
    for (const d of dims) {
      expect(d.bands.reduce((s, b) => s + b.count, 0)).toBe(0);
    }
  });
});
