import { describe, it, expect } from "vitest";
import { paginateAll } from "./paginate";

/**
 * Regression for the "newest candidate has no score" bug: PostgREST caps a batch
 * query at 1000 rows, so once an org has >1000 total responses the last
 * candidates' rows fall off and they get no fit. These model that cap with a fake
 * pager and prove pagination reads every page (not just the first 1000).
 */
describe("paginateAll", () => {
  // A fake DB of `total` rows served in pages capped at `cap` (mirrors PostgREST).
  const fakePager =
    (total: number, cap = 1000) =>
    async (from: number, to: number) => {
      const rows = Array.from({ length: total }, (_, i) => ({ id: i }));
      return rows.slice(from, Math.min(to + 1, from + cap));
    };

  it("reads ALL rows when the total exceeds one page (the bug: 1225 > 1000)", async () => {
    const all = await paginateAll(fakePager(1225));
    expect(all).toHaveLength(1225);
    // The newest rows (1000..1224) — previously dropped — are present.
    expect(all.at(-1)).toEqual({ id: 1224 });
    expect(all.some((r) => r.id === 1000)).toBe(true);
  });

  it("stops after one page when the total is under the cap (no needless page)", async () => {
    let calls = 0;
    const all = await paginateAll((from, to) => {
      calls++;
      return fakePager(30)(from, to);
    });
    expect(all).toHaveLength(30);
    expect(calls).toBe(1);
  });

  it("handles an exact multiple of the page size", async () => {
    expect(await paginateAll(fakePager(2000))).toHaveLength(2000);
  });

  it("returns empty for no rows", async () => {
    expect(await paginateAll(fakePager(0))).toEqual([]);
  });

  it("works with a small page size (logic independent of the 1000 constant)", async () => {
    expect(await paginateAll(fakePager(25, 10), 10)).toHaveLength(25);
  });
});
