-- ─────────────────────────────────────────────────────────────────────
-- Custom application questions.
-- ─────────────────────────────────────────────────────────────────────
-- Operators define extra application questions (stored in the org's
-- branding). A candidate's answers are snapshotted onto the application as
-- [{ id, label, value }] so they still render even if the question list
-- later changes.
-- ─────────────────────────────────────────────────────────────────────
alter table applications
  add column if not exists custom_answers jsonb not null default '[]'::jsonb;
