import {
  CATEGORIES,
  CATEGORY_LABELS,
  QUESTIONS,
  RISK_FLAG_LABELS,
  type Category,
  type RiskFlagKey,
  categoryMax,
} from "./schema";
import type { Recommendation } from "../supabase/types";

export type AnswerMap = Record<string, unknown>;

export interface ScoreResult {
  total: number;
  totalMax: number;
  categoryScores: Record<Category, number>;
  categoryMax: Record<Category, number>;
  recommendation: Recommendation;
  riskFlags: Array<{ key: RiskFlagKey; label: string }>;
  pct: number; // 0..1
}

/**
 * Compute scores from a flat answer map (question_key -> answer).
 *
 * - MC questions: lookup the chosen option's score deltas + flags.
 * - Agreement scales: 1..5 → score from `scale` (default -2..2).
 * - Short-answer: not auto-scored, but very short answers add a soft
 *   coachability flag so admins notice.
 *
 * Recommendation is computed off % of max, with a few hard caps:
 *   - phone_policy_concern → at most "borderline".
 *   - 3+ critical flags    → at most "borderline".
 */
export function scoreAnswers(answers: AnswerMap): ScoreResult {
  const cat: Record<Category, number> = {
    ownership: 0,
    coachability: 0,
    reliability: 0,
    rule: 0,
    productive: 0,
    customer: 0,
  };
  const flags = new Set<RiskFlagKey>();

  for (const q of QUESTIONS) {
    const a = answers[q.id];
    if (a == null || a === "") continue;

    if (q.kind === "single") {
      const choice = q.choices.find((c) => c.value === a);
      if (!choice) continue;
      for (const c of CATEGORIES) {
        const delta = choice.scores?.[c];
        if (delta) cat[c] += delta;
      }
      for (const f of choice.flags ?? []) flags.add(f);
    } else if (q.kind === "agree") {
      const idx = Number(a);
      if (!Number.isFinite(idx) || idx < 1 || idx > 5) continue;
      const scale = q.scale ?? [-2, -1, 0, 1, 2];
      cat[q.category] += scale[idx - 1];
      if (idx === 1 && q.lowFlag) flags.add(q.lowFlag);
    } else if (q.kind === "text") {
      const text = String(a).trim();
      if (q.minLength && text.length < Math.max(20, q.minLength / 2)) {
        // Very short text answer — soft signal of low ownership/effort.
        if (q.category === "ownership") flags.add("low_ownership");
        if (q.category === "coachability") flags.add("feedback_defensive");
      }
    }
  }

  const max = categoryMax();
  const total = CATEGORIES.reduce((sum, c) => sum + cat[c], 0);
  const totalMax = CATEGORIES.reduce((sum, c) => sum + max[c], 0);
  const pct = totalMax > 0 ? Math.max(0, total) / totalMax : 0;

  let recommendation: Recommendation;
  if (pct >= 0.85) recommendation = "strong_interview";
  else if (pct >= 0.65) recommendation = "interview";
  else if (pct >= 0.4) recommendation = "borderline";
  else recommendation = "do_not_interview";

  // Hard caps based on critical flags.
  const phoneIssue = flags.has("phone_policy_concern");
  const criticalCount = [
    "phone_policy_concern",
    "rule_resistance",
    "blame_shifting",
    "feedback_defensive",
    "low_ownership",
    "weak_customer_instincts",
  ].reduce((n, k) => n + (flags.has(k as RiskFlagKey) ? 1 : 0), 0);

  if (phoneIssue && recommendation !== "do_not_interview") {
    recommendation =
      recommendation === "strong_interview" ? "borderline" : recommendation;
    if (recommendation === "interview") recommendation = "borderline";
  }
  if (criticalCount >= 3 && recommendation === "strong_interview") {
    recommendation = "interview";
  }
  if (criticalCount >= 4 && recommendation === "interview") {
    recommendation = "borderline";
  }

  return {
    total,
    totalMax,
    categoryScores: cat,
    categoryMax: max,
    recommendation,
    riskFlags: [...flags].map((k) => ({ key: k, label: RISK_FLAG_LABELS[k] })),
    pct,
  };
}

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  strong_interview: "Strong Interview",
  interview: "Interview",
  borderline: "Borderline",
  do_not_interview: "Do Not Interview",
};

export const RECOMMENDATION_TONES: Record<Recommendation, string> = {
  strong_interview: "bg-mint/30 text-[color:var(--brand-ink)]",
  interview: "bg-yellow/40 text-[color:var(--brand-ink)]",
  borderline: "bg-brand-soft text-[color:var(--brand-pink-600)]",
  do_not_interview: "bg-[#1a1530] text-white",
};

export { CATEGORY_LABELS, CATEGORIES, RISK_FLAG_LABELS };
