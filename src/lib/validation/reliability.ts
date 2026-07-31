import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { fetchResponsesForSessions } from "@/lib/assessment/responses";
import { facetReliability, type FacetReliability } from "./reliability-core";

/**
 * Instrument reliability (spec §4a) — outcome-free, needs zero hire/performance
 * data. Pooled across ALL orgs: reliability is a property of the instrument
 * version, not any one tenant, so pooling is aggregate-only and safe (no PII,
 * no outcomes, no org identity retained in the result).
 */

export interface VersionReliability {
  version: string;
  nSessions: number; // distinct complete sessions of this methodology_version
  facets: FacetReliability[];
}

interface ItemMeta {
  version: string;
  item_id: string;
  facet: string;
  category_ui: string;
  keying: "positive" | "reverse";
  sort_order: number;
}

export async function instrumentReliability(): Promise<VersionReliability[]> {
  const supa = adminClient();

  // 1. Every complete session, whatever the org — pooled, aggregate-only.
  const { data: sessionRows, error: sessErr } = await supa
    .from("assessment_sessions")
    .select("id, methodology_version")
    .eq("status", "complete");
  if (sessErr) throw new Error(`instrumentReliability: ${sessErr.message}`);
  const sessions = (sessionRows ?? []) as { id: string; methodology_version: string }[];
  if (sessions.length === 0) return [];

  const versions = [...new Set(sessions.map((s) => s.methodology_version))];
  const sessionIds = sessions.map((s) => s.id);

  // 2. Item metadata + responses, in parallel. Responses paginate past
  // PostgREST's 1000-row cap (70 sessions × ~30 personality items > 1000) —
  // fetchResponsesForSessions already handles that; filter to personality here.
  const [{ data: itemRows, error: itemErr }, allResponses] = await Promise.all([
    supa
      .from("item_bank_items")
      .select("version, item_id, facet, category_ui, keying, sort_order")
      .in("version", versions)
      .eq("item_kind", "personality"),
    fetchResponsesForSessions(sessionIds),
  ]);
  if (itemErr) throw new Error(`instrumentReliability: ${itemErr.message}`);
  const items = (itemRows ?? []) as ItemMeta[];

  // session_id -> item_id -> value_int (personality only, non-null).
  const bySession = new Map<string, Map<string, number>>();
  for (const r of allResponses) {
    if (r.item_kind !== "personality" || r.value_int == null) continue;
    if (!bySession.has(r.session_id)) bySession.set(r.session_id, new Map());
    bySession.get(r.session_id)!.set(r.item_id, r.value_int);
  }

  const out: VersionReliability[] = [];
  for (const version of versions) {
    const sessIdsForVersion = sessions
      .filter((s) => s.methodology_version === version)
      .map((s) => s.id);

    const byFacet = new Map<string, ItemMeta[]>();
    for (const it of items) {
      if (it.version !== version) continue;
      if (!byFacet.has(it.facet)) byFacet.set(it.facet, []);
      byFacet.get(it.facet)!.push(it);
    }

    const facets: FacetReliability[] = [];
    for (const [facet, facetItemsUnsorted] of byFacet) {
      const facetItems = [...facetItemsUnsorted].sort(
        (a, b) => a.sort_order - b.sort_order || a.item_id.localeCompare(b.item_id)
      );
      if (facetItems.length < 2) continue; // needs ≥2 items to compute anything
      const itemIds = facetItems.map((i) => i.item_id);
      const categoryUi = facetItems[0].category_ui;
      const keyingById = new Map(facetItems.map((i) => [i.item_id, i.keying]));

      // Per-respondent PARTIAL facet answers (rotating-form design — a session
      // answers only a subset of a facet's items). Reverse-key to match
      // scoring.ts's `keyed` = 6 − value (5-point scale). Available-case
      // diagnostics inside facetReliability handle the missingness.
      const respondentMaps: Map<string, number>[] = [];
      for (const sid of sessIdsForVersion) {
        const answered = bySession.get(sid);
        if (!answered) continue;
        const facetAnswers = new Map<string, number>();
        for (const it of facetItems) {
          const v = answered.get(it.item_id);
          if (v == null) continue;
          facetAnswers.set(it.item_id, keyingById.get(it.item_id) === "reverse" ? 6 - v : v);
        }
        if (facetAnswers.size > 0) respondentMaps.push(facetAnswers);
      }
      if (respondentMaps.length < 2) continue; // needs ≥2 respondents

      facets.push(facetReliability(facet, categoryUi, itemIds, respondentMaps));
    }

    // Stable display order: by each facet's minimum sort_order.
    const minSortOrder = new Map(
      [...byFacet.entries()].map(([facet, facetItems]) => [
        facet,
        Math.min(...facetItems.map((i) => i.sort_order)),
      ])
    );
    facets.sort((a, b) => (minSortOrder.get(a.facet) ?? 0) - (minSortOrder.get(b.facet) ?? 0));

    out.push({ version, nSessions: sessIdsForVersion.length, facets });
  }

  out.sort((a, b) => a.version.localeCompare(b.version));
  return out;
}
