-- ─────────────────────────────────────────────────────────────────────
-- Scheduler Phase 2a: employees get real accounts. An employee can sign in to
-- a separate /staff area (email+password or Google/Apple SSO) to see their own
-- schedule. Access is roster-gated: an email may authenticate for an org only
-- if it matches an employees.email in that org.
--
--   email          — denormalized from the source application (the allowlist key)
--   user_id        — linked Supabase auth user (null until they activate)
--   invited_at     — when a set-password invite was last emailed
--   activated_at   — first successful sign-in as this employee
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

alter table employees
  add column if not exists email text,
  add column if not exists user_id uuid,
  add column if not exists invited_at timestamptz,
  add column if not exists activated_at timestamptz;

-- Backfill email from the source application (contact the candidate applied with).
update employees e
set email = a.email
from applications a
where e.application_id = a.id
  and e.email is null
  and a.email is not null;

-- At most one employee per auth user per org.
create unique index if not exists uq_employees_user
  on employees(org_id, user_id) where user_id is not null;
create index if not exists idx_employees_email on employees(org_id, lower(email));
