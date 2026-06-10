/**
 * Assessment form selection.
 *
 * Each candidate answers a FIXED-size subset drawn from a GROWING item
 * bank (v0.3 = 83 items). The subset must be:
 *   - stratified by facet (every category/facet gets a scorable minimum),
 *   - keying-balanced within each facet (mix of positive/reverse to control
 *     acquiescence bias), and
 *   - exposure-balanced across candidates (least-administered items first),
 *     so the whole bank field-validates evenly over the population.
 *
 * This module is pure (no DB, no I/O): the caller maps item-bank rows to
 * `BankItem`s and persists the returned ids on the assessment session
 * (`assessment_sessions.form_item_ids`). Attention checks are injected at
 * render time and are NOT part of the scored selection.
 */

export type Keying = "positive" | "reverse";

export interface BankItem {
  itemId: string;
  facet: string;
  keying: Keying;
}

export interface FormSpec {
  /** Scored items to draw per facet. Sum = total scored personality items. */
  facetFloors: Record<string, number>;
  /** Attention-check slots woven in at render (not drawn from the bank). */
  attentionChecks: number;
}

export interface SelectOptions {
  /** itemId -> times already administered (lower = preferred). */
  exposure?: Record<string, number>;
  /** Rotation seed (e.g. a per-session counter) to vary picks when exposure ties. */
  rotation?: number;
}

export interface AssessmentForm {
  /** Flat list of scored item ids, in presentation order. */
  scoredItemIds: string[];
  /** Scored item ids grouped by facet. */
  byFacet: Record<string, string[]>;
  /** How many attention checks to weave in at render. */
  attentionCheckSlots: number;
}

/**
 * v0.3 default: 28 scored items + 2 attention checks (30 presented), tuned so
 * every CATEGORY clears ~0.70 reliability. Composure is a single-facet
 * category, so it gets a higher floor (can't borrow from sibling facets);
 * Dependability and Initiative get an extra item as the highest-value
 * predictors. Configurable per methodology version.
 */
export const DEFAULT_FORM_SPEC_V03: FormSpec = {
  facetFloors: {
    Dependability: 4,
    Achievement: 3,
    "Customer Warmth": 3,
    "Team Cooperation": 3,
    Coachability: 2,
    "Internal Locus of Control": 3,
    "Initiative & Ownership": 4,
    Composure: 6,
  },
  attentionChecks: 2,
};

export function formSpecTotal(spec: FormSpec): number {
  return Object.values(spec.facetFloors).reduce((a, b) => a + b, 0);
}

/**
 * Build the per-session assessment form. Deterministic given the same bank,
 * spec, exposure, and rotation — so resume/scoring see the same items.
 */
export function buildAssessmentForm(
  bank: BankItem[],
  spec: FormSpec = DEFAULT_FORM_SPEC_V03,
  opts: SelectOptions = {}
): AssessmentForm {
  const exposure = opts.exposure ?? {};
  const rotation = opts.rotation ?? 0;

  const byFacet: Record<string, string[]> = {};
  for (const facet of Object.keys(spec.facetFloors)) {
    const target = spec.facetFloors[facet];
    const pool = bank.filter((i) => i.facet === facet);
    byFacet[facet] = pickBalanced(pool, target, exposure, rotation);
  }

  // Interleave facets in presentation order so a candidate doesn't get a long
  // run of one facet (round-robin across facets).
  const scoredItemIds = interleave(Object.values(byFacet));

  return { scoredItemIds, byFacet, attentionCheckSlots: spec.attentionChecks };
}

/** Pick `target` items from a facet pool, balancing keying and exposure. */
function pickBalanced(
  pool: BankItem[],
  target: number,
  exposure: Record<string, number>,
  rotation: number
): string[] {
  const order = (arr: BankItem[]): BankItem[] => {
    const sorted = [...arr].sort(
      (a, b) =>
        (exposure[a.itemId] ?? 0) - (exposure[b.itemId] ?? 0) ||
        (a.itemId < b.itemId ? -1 : a.itemId > b.itemId ? 1 : 0)
    );
    if (sorted.length === 0) return sorted;
    const r = ((rotation % sorted.length) + sorted.length) % sorted.length;
    return [...sorted.slice(r), ...sorted.slice(0, r)];
  };

  const pos = order(pool.filter((i) => i.keying === "positive"));
  const rev = order(pool.filter((i) => i.keying === "reverse"));
  const picked: string[] = [];
  // Alternate keying to balance acquiescence; fall back when one side empties.
  let takePos = pos.length >= rev.length;
  while (picked.length < target && (pos.length || rev.length)) {
    if (takePos && pos.length) picked.push(pos.shift()!.itemId);
    else if (!takePos && rev.length) picked.push(rev.shift()!.itemId);
    else if (pos.length) picked.push(pos.shift()!.itemId);
    else if (rev.length) picked.push(rev.shift()!.itemId);
    takePos = !takePos;
  }
  return picked;
}

/** Round-robin merge of per-facet lists into one presentation order. */
function interleave(lists: string[][]): string[] {
  const out: string[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) {
    for (const list of lists) {
      if (i < list.length) out.push(list[i]);
    }
  }
  return out;
}
