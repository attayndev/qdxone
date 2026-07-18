/** Hiring-decision options — pure/client-safe (no server imports). */

export type Decision = "hired" | "not_hired" | "declined";

export const DECISIONS: { value: Decision; label: string }[] = [
  { value: "hired", label: "Hired" },
  { value: "not_hired", label: "Interviewed — not hired" },
  { value: "declined", label: "Declined to interview" },
];

export const DECISION_LABEL: Record<Decision, string> = {
  hired: "Hired",
  not_hired: "Interviewed — not hired",
  declined: "Declined to interview",
};

export function isDecision(v: string | null | undefined): v is Decision {
  return v === "hired" || v === "not_hired" || v === "declined";
}

/**
 * Default pick-list for the decision "Reason" dropdown. Operators edit their
 * own list — any reason they type is remembered for next time — so these are
 * only the starting options for an org that hasn't customized.
 */
export const DEFAULT_DECISION_REASONS: string[] = [
  "Too young",
  "On their phone too much",
  "Availability didn't fit",
  "Attendance / reliability concerns",
  "Roles already filled",
  "No-show / didn't respond",
  "Not the right fit",
];

/** Resolve an org's reason list, falling back to the defaults. */
export function decisionReasons(orgReasons?: string[] | null): string[] {
  return orgReasons && orgReasons.length ? orgReasons : DEFAULT_DECISION_REASONS;
}
