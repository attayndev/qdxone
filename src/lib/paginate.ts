/**
 * Fetch every page until one comes back short. `fetchPage(from, to)` returns one
 * page (inclusive range). Pure — no deps — so the pagination logic is unit-tested
 * without a live database. This is the guard against PostgREST's 1000-row cap
 * silently truncating a batch query (which drops the newest rows of an `.in()`).
 */
export async function paginateAll<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  page = 1000
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += page) {
    const rows = await fetchPage(from, from + page - 1);
    out.push(...rows);
    if (rows.length < page) break;
  }
  return out;
}
