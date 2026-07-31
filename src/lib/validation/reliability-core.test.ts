import { describe, it, expect } from "vitest";
import { cronbachAlpha, pearson, facetReliability } from "./reliability-core";

describe("cronbachAlpha (complete-block only)", () => {
  it("returns 1.0 when items move in perfect lockstep (item2 = item1 + const)", () => {
    // item vars = 5/3 each; total var (totals 3,5,7,9) = 20/3.
    // α = 2/1 · (1 − (10/3)/(20/3)) = 1.0
    expect(cronbachAlpha([[1, 2], [2, 3], [3, 4], [4, 5]])!).toBeCloseTo(1.0, 10);
  });
  it("null when total variance is 0", () => {
    expect(cronbachAlpha([[1, 3], [2, 2], [3, 1]])).toBeNull();
  });
  it("null for degenerate shapes", () => {
    expect(cronbachAlpha([[1, 2, 3]])).toBeNull();
    expect(cronbachAlpha([[1], [2], [3]])).toBeNull();
    expect(cronbachAlpha([])).toBeNull();
  });
});

describe("pearson", () => {
  it("+1 / −1 / null-constant", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])!).toBeCloseTo(1, 10);
    expect(pearson([1, 2, 3], [3, 2, 1])!).toBeCloseTo(-1, 10);
    expect(pearson([1, 1, 1], [1, 2, 3])).toBeNull();
  });
});

const m = (o: Record<string, number>) => new Map(Object.entries(o));

describe("facetReliability (rotating-form, available-case)", () => {
  it("computes available-case item-total from PARTIAL responses (no complete block)", () => {
    // Nobody answers all 3 items — but item-total is still computable.
    // A and B cohere; C is noise. Each respondent answers 2 of {A,B,C}.
    const rows = [
      m({ A: 5, B: 5 }),
      m({ A: 4, C: 1 }),
      m({ B: 4, C: 5 }),
      m({ A: 3, B: 3 }),
      m({ B: 2, C: 3 }),
      m({ A: 1, B: 1 }),
    ];
    const r = facetReliability("F", "Reliability & Drive", ["A", "B", "C"], rows);
    expect(r.nRespondents).toBe(6);
    expect(r.alpha).toBeNull(); // no complete block
    expect(r.alphaNote).toMatch(/rotating-form/i);
    const byId = Object.fromEntries(r.items.map((i) => [i.itemId, i]));
    expect(byId.A.n).toBe(4);
    expect(byId.A.itemTotalR).not.toBeNull(); // computable despite missingness
  });

  it("still computes α when a complete block exists (fixed-form fallback)", () => {
    const rows = [
      m({ A: 1, B: 1 }),
      m({ A: 2, B: 2 }),
      m({ A: 3, B: 3 }),
      m({ A: 4, B: 4 }),
    ];
    const r = facetReliability("F", "X", ["A", "B"], rows);
    expect(r.alpha).not.toBeNull();
    expect(r.alpha!).toBeGreaterThan(0.9);
  });

  it("flags a weak item (low available-case item-total)", () => {
    const rows = [
      m({ A: 5, B: 5, C: 1 }),
      m({ A: 4, B: 4, C: 5 }),
      m({ A: 3, B: 3, C: 2 }),
      m({ A: 2, B: 2, C: 5 }),
      m({ A: 1, B: 1, C: 1 }),
    ];
    const r = facetReliability("F", "X", ["A", "B", "C"], rows);
    const c = r.items.find((i) => i.itemId === "C")!;
    const a = r.items.find((i) => i.itemId === "A")!;
    expect(c.itemTotalR!).toBeLessThan(a.itemTotalR!);
  });
});
