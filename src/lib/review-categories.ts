/**
 * The four dimensions a performance review rates — the SAME four the assessment
 * measures, so on-the-job performance can be validated against the assessment
 * dimension by dimension. One canonical list drives the review UI, the action,
 * the analytics, and the demo seed. No server imports (the client form uses it).
 *
 *   academic (assessment category) ↔ label (operator-facing) ↔ column (DB)
 */
export const REVIEW_CATEGORIES = [
  {
    academic: "Conscientiousness",
    label: "Reliability & Drive",
    column: "rating_conscientiousness",
  },
  {
    academic: "Agreeableness",
    label: "People Skills",
    column: "rating_agreeableness",
  },
  {
    academic: "Emotional Stability",
    label: "Composure",
    column: "rating_emotional_stability",
  },
  {
    academic: "Self-Direction",
    label: "Ownership",
    column: "rating_self_direction",
  },
] as const;

export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];
export type ReviewCategoryColumn = ReviewCategory["column"];
