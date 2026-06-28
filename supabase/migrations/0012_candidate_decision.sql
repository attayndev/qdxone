-- ─────────────────────────────────────────────────────────────────────
-- Hiring decision per candidate. Distinct from the assessment 'fit' score —
-- this is the human outcome the manager records after reviewing/interviewing:
--   decision         — 'hired' | 'not_hired' | 'declined'  (null = undecided)
--                      (text, app-validated; avoids an enum migration)
--   decision_reason  — free-text why (kept for every outcome)
--   decision_at      — when it was recorded
--   decided_by       — which member recorded it (auth user id)
-- Recording a decision also sets applications.status = 'decision_made'.
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

alter table applications
  add column if not exists decision text,
  add column if not exists decision_reason text,
  add column if not exists decision_at timestamptz,
  add column if not exists decided_by uuid;
