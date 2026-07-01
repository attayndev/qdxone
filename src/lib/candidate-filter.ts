/**
 * The candidate list filter model — one row of single-select "view" chips plus a
 * free-text search, replacing the old stack of dropdowns. Kept deliberately
 * small and identical in meaning to the mobile app's copy (mobile/src/lib/
 * candidateFilter.ts) so "Strong fit" etc. mean the same thing on both. Pure /
 * client-safe.
 */

export type CandidateView = "active" | "new" | "review" | "strong" | "decided";

export const CANDIDATE_VIEWS: { key: CandidateView; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "new", label: "New" },
  { key: "review", label: "To review" },
  { key: "strong", label: "Strong fit" },
  { key: "decided", label: "Decided" },
];

export const DEFAULT_VIEW: CandidateView = "active";

export function asView(v: string | null | undefined): CandidateView {
  return CANDIDATE_VIEWS.some((x) => x.key === v) ? (v as CandidateView) : DEFAULT_VIEW;
}

export interface FilterableCandidate {
  status: string;
  decision: string | null;
  fit: string | null;
}

/** Does a candidate belong in the given view? Identical logic on web + mobile. */
export function matchesView(c: FilterableCandidate, view: CandidateView): boolean {
  switch (view) {
    case "new":
      return c.status === "new" || c.status === "assessment_sent";
    case "review":
      return c.status === "assessment_complete" && !c.decision;
    case "strong":
      return c.fit === "Strong fit" && !c.decision;
    case "decided":
      return !!c.decision;
    case "active":
    default:
      return !c.decision;
  }
}

/** Free-text match over name, email, and role — one search box covers all. */
export function matchesSearch(
  c: { firstName: string; lastName: string; email: string; role: string },
  q: string
): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return (
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(t) ||
    c.email.toLowerCase().includes(t) ||
    c.role.toLowerCase().includes(t)
  );
}
