// Pure psychometric-reliability math — no server/DB imports, so vitest can load it.
// The qdx assessment administers a ROTATING SUBSET of each facet's items per
// session (planned-missing / matrix-sampled design — verified: 41 distinct item
// sets across 70 sessions, each respondent sees ~a third of a facet's items). So
// classical complete-case Cronbach's α is NOT computable (almost nobody answers
// every item in a facet). The design-robust, computable signal is the
// AVAILABLE-CASE corrected item-total correlation per item, which flags weak
// items — the actual instrument-refinement lever. α is attempted only on a
// genuine complete block and returns null (with a reason) otherwise.

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Sample variance (n−1 denominator). 0 for <2 points. */
function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1);
}

/** Pearson r; null if either series is constant or <2 points. */
export function pearson(a: number[], b: number[]): number | null {
  const n = a.length;
  if (n < 2 || b.length !== n) return null;
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  if (da === 0 || db === 0) return null;
  return num / Math.sqrt(da * db);
}

/**
 * Cronbach's α for a COMPLETE respondents×items matrix (rows keyed common
 * direction). Null when undefined (<2 items/respondents, ragged rows, or zero
 * total variance). Only valid on a complete block — see the file header on why
 * that block rarely exists for this instrument.
 */
export function cronbachAlpha(matrix: number[][]): number | null {
  const nResp = matrix.length;
  const k = matrix[0]?.length ?? 0;
  if (nResp < 2 || k < 2) return null;
  if (matrix.some((r) => r.length !== k)) return null;
  let sumItemVar = 0;
  for (let j = 0; j < k; j++) sumItemVar += variance(matrix.map((r) => r[j]));
  const totalVar = variance(matrix.map((r) => r.reduce((a, b) => a + b, 0)));
  if (totalVar === 0) return null;
  return (k / (k - 1)) * (1 - sumItemVar / totalVar);
}

export interface ItemDiagnostic {
  itemId: string;
  n: number; // respondents who answered this item
  mean: number | null;
  sd: number | null;
  /** Available-case corrected item-total: this item vs. the mean of the
   *  respondent's OTHER answered items in the facet (design-robust). */
  itemTotalR: number | null;
  weak: boolean; // itemTotalR < 0.20 (a candidate to review/prune)
}

export interface FacetReliability {
  facet: string;
  categoryUi: string;
  nItems: number;
  /** Respondents who answered ≥1 item in the facet. */
  nRespondents: number;
  /** Classical α — null under the rotating-form design; `alphaNote` says why. */
  alpha: number | null;
  alphaNote: string | null;
  items: ItemDiagnostic[];
  weakItems: string[];
  /** Median available-case item-total — a rough facet-coherence read when α is null. */
  medianItemTotal: number | null;
}

const WEAK = 0.2;

/**
 * Facet reliability under rotating administration. `respondentMaps` = each
 * respondent's reverse-keyed answers to THIS facet's items (partial), keyed by
 * itemId. Computes per-item available-case diagnostics; α only if a complete
 * block happens to exist.
 */
export function facetReliability(
  facet: string,
  categoryUi: string,
  itemIds: string[],
  respondentMaps: Map<string, number>[]
): FacetReliability {
  const answered = respondentMaps.filter((m) => m.size > 0);
  const nRespondents = answered.length;

  const items: ItemDiagnostic[] = itemIds.map((itemId) => {
    const vals = answered.map((m) => m.get(itemId)).filter((v): v is number => v != null);
    const n = vals.length;
    // available-case corrected item-total
    const xs: number[] = [];
    const ys: number[] = [];
    for (const resp of answered) {
      const v = resp.get(itemId);
      if (v == null) continue;
      const others: number[] = [];
      for (const [k, val] of resp) if (k !== itemId) others.push(val);
      if (others.length === 0) continue;
      xs.push(v);
      ys.push(mean(others));
    }
    const itemTotalR = xs.length >= 2 ? pearson(xs, ys) : null;
    return {
      itemId,
      n,
      mean: n >= 1 ? mean(vals) : null,
      sd: n >= 2 ? Math.sqrt(variance(vals)) : null,
      itemTotalR,
      weak: itemTotalR != null && itemTotalR < WEAK,
    };
  });

  // Attempt classical α only on a genuine complete block: items every respondent
  // in some subset answered. Under rotating forms this is virtually always empty.
  let alpha: number | null = null;
  let alphaNote: string | null =
    "Not computable: rotating-form design (respondents answer a partial, varying subset of each facet's items). Use item-total diagnostics; a covariance/IRT-based reliability is an I/O-psychologist analysis.";
  const complete = answered.filter((m) => itemIds.every((id) => m.has(id)));
  if (complete.length >= 2 && itemIds.length >= 2) {
    alpha = cronbachAlpha(complete.map((m) => itemIds.map((id) => m.get(id)!)));
    alphaNote = alpha == null ? alphaNote : `Complete block: ${complete.length} respondents answered all ${itemIds.length} items.`;
  }

  const rs = items.map((i) => i.itemTotalR).filter((r): r is number => r != null).sort((a, b) => a - b);
  const medianItemTotal = rs.length
    ? rs.length % 2
      ? rs[(rs.length - 1) / 2]
      : (rs[rs.length / 2 - 1] + rs[rs.length / 2]) / 2
    : null;

  return {
    facet,
    categoryUi,
    nItems: itemIds.length,
    nRespondents,
    alpha,
    alphaNote,
    items,
    weakItems: items.filter((i) => i.weak).map((i) => i.itemId),
    medianItemTotal,
  };
}
