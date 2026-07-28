-- ─────────────────────────────────────────────────────────────────────
-- Roster import + benchmark: existing (pre-qdx) employees get a lightweight
-- "shadow application" so the assessment + fit analytics machinery works for
-- them. `source` distinguishes these from real job applicants:
--   null            — a normal candidate application (applied for a job)
--   'roster_import'  — a shadow app for an imported existing employee
-- Candidate lists / hiring-funnel reports exclude 'roster_import'; the
-- fit-vs-performance analytics include them (that's the point — benchmark all).
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

alter table applications
  add column if not exists source text;
create index if not exists idx_applications_source on applications(org_id, source);
