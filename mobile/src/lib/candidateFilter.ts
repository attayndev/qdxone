/**
 * Candidate list filter model for the app — one row of single-select "view"
 * chips plus a free-text search. Mirrors the web's src/lib/candidate-filter.ts
 * one-for-one so the views mean the same thing on both. Keep them in sync.
 */

export type CandidateView = "active" | "new" | "review" | "strong" | "decided";

export const CANDIDATE_VIEWS: { key: CandidateView; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "new", label: "New" },
  { key: "review", label: "To review" },
  { key: "strong", label: "Strong fit" },
  { key: "decided", label: "Decided" },
];

export interface FilterableCandidate {
  status: string;
  decision: string | null;
  fit: string | null;
}

/** Does a candidate belong in the given view? Identical logic to the web. */
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
