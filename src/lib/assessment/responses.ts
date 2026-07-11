import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { paginateAll } from "@/lib/paginate";

export interface ResponseRow {
  session_id: string;
  item_id: string;
  item_kind: string;
  value_int: number | null;
  response_ms: number | null;
}

/**
 * Fetch ALL assessment_responses for a set of session ids, paginating past the
 * 1000-row cap. A plain `.in("session_id", ids)` silently truncates at 1000 once
 * an org accumulates enough responses — and rows come back oldest-first, so it's
 * the NEWEST candidates whose responses get dropped, losing their fit/score in
 * every list-level computation. Ordered by (session_id, item_id) — a unique pair
 * — so range pagination is exact.
 */
export async function fetchResponsesForSessions(sessionIds: string[]): Promise<ResponseRow[]> {
  if (sessionIds.length === 0) return [];
  const supa = adminClient();
  return paginateAll<ResponseRow>(async (from, to) => {
    const { data, error } = await supa
      .from("assessment_responses")
      .select("session_id, item_id, item_kind, value_int, response_ms")
      .in("session_id", sessionIds)
      .order("session_id", { ascending: true })
      .order("item_id", { ascending: true })
      .range(from, to);
    if (error) throw new Error(`fetchResponsesForSessions: ${error.message}`);
    return (data ?? []) as unknown as ResponseRow[];
  });
}
