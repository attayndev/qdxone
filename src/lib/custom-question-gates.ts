/**
 * Custom-question gates: turn an operator's gated questions + an applicant's
 * answers into pass/fail findings and the fit cap they imply. Pure — no DB — so
 * it's shared by the candidate list, the mobile API, and the detail report, and
 * unit-testable.
 */

import type { CustomQuestion, CustomQuestionGate } from "@/lib/supabase/types";
import type { OverallFit } from "@/lib/assessment/scoring";

export interface GateFinding {
  id: string;
  label: string;
  gate: CustomQuestionGate;
  expected: string;
  answer: string;
}

const norm = (s: string | null | undefined): string => (s ?? "").trim().toLowerCase();

/** Questions that actually gate (have both a gate level and an expected answer). */
export function gatedQuestions(questions: CustomQuestion[]): CustomQuestion[] {
  return questions.filter((q) => q.gate && q.expected != null && q.expected !== "");
}

/**
 * Findings for every gated question the applicant answered but did NOT pass
 * (a present answer != expected, case-insensitive). A MISSING answer is not a
 * fail — a role-scoped question the candidate was never asked must not flag
 * them; and required gated questions are always answered at apply time.
 */
export function evaluateCustomGates(
  questions: CustomQuestion[],
  answers: { id: string; value: string }[]
): GateFinding[] {
  const byId = new Map(answers.map((a) => [a.id, (a.value ?? "").trim()]));
  const findings: GateFinding[] = [];
  for (const q of gatedQuestions(questions)) {
    const answer = byId.get(q.id);
    if (answer == null || answer === "") continue; // not asked / not answered
    if (norm(answer) !== norm(q.expected)) {
      findings.push({
        id: q.id,
        label: q.label,
        gate: q.gate as CustomQuestionGate,
        expected: q.expected as string,
        answer,
      });
    }
  }
  return findings;
}

const FIT_RANK: Record<OverallFit, number> = {
  "Strong fit": 5,
  Consider: 4,
  Caution: 3,
  "Not recommended": 2,
  Incomplete: 1,
};

/** The worst cap implied by findings, or null if none cap (flags don't cap). */
export function fitCapFromGates(findings: GateFinding[]): OverallFit | null {
  if (findings.some((f) => f.gate === "legal")) return "Not recommended";
  if (findings.some((f) => f.gate === "knockout")) return "Caution";
  return null;
}

/**
 * Apply a cap: never let the fit sit above it. "Incomplete" (no usable
 * assessment) is left as-is — the gate finding still surfaces separately.
 */
export function applyFitCap(overall: OverallFit, cap: OverallFit | null): OverallFit {
  if (!cap || overall === "Incomplete") return overall;
  return FIT_RANK[overall] > FIT_RANK[cap] ? cap : overall;
}
