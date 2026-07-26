-- ─────────────────────────────────────────────────────────────────────
-- Per-category performance ratings on reviews. A review already carries an
-- overall `rating` (1–5); these four columns rate the employee on the SAME
-- four dimensions the assessment measures, so on-the-job performance can be
-- validated against the assessment dimension by dimension:
--   rating_conscientiousness   → "Reliability & Drive"
--   rating_agreeableness       → "People Skills"
--   rating_emotional_stability → "Composure"
--   rating_self_direction      → "Ownership"
-- Nullable (a manager may rate only the overall). Backward compatible.
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

alter table employee_reviews
  add column if not exists rating_conscientiousness int
    check (rating_conscientiousness between 1 and 5),
  add column if not exists rating_agreeableness int
    check (rating_agreeableness between 1 and 5),
  add column if not exists rating_emotional_stability int
    check (rating_emotional_stability between 1 and 5),
  add column if not exists rating_self_direction int
    check (rating_self_direction between 1 and 5);
