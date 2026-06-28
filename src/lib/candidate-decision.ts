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
