-- ─────────────────────────────────────────────────────────────────────
-- Pay transparency on job postings (NY + CA/CO/WA/IL... law): a good-faith
-- min/max wage range on every advertisement. Restaurant roles are often tipped,
-- so a `tips` flag drives a "+ tips" disclosure on top of the base range. The
-- base range is the compliance figure (and the JobPosting baseSalary); tips are
-- shown as supplemental, not folded into the legal range. Idempotent.
-- ─────────────────────────────────────────────────────────────────────

alter table job_postings
  add column if not exists pay_min numeric(10, 2),
  add column if not exists pay_max numeric(10, 2),
  add column if not exists pay_period text not null default 'hour'
    check (pay_period in ('hour', 'year')),
  add column if not exists tips boolean not null default false;
