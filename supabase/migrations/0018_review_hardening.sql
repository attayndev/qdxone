-- 0018_review_hardening.sql
-- Overnight code-review hardening. Safe to run once; each statement is idempotent.
-- Apply in the Supabase SQL editor (like prior migrations).

-- ── H1: stop exposing the assessment answer key via the public anon key ──────
-- item_bank_items.keying (per-item scoring direction) and scoring_config.config
-- (cutoffs/weights) were world-readable through the REST API. The app only ever
-- reads these tables with the service role (bypasses RLS), so dropping the
-- `using(true)` SELECT policies removes public read with zero app impact. RLS
-- stays enabled → the tables become service-role-only.
drop policy if exists methodology_versions_read on methodology_versions;
drop policy if exists assessment_taxonomy_read on assessment_taxonomy;
drop policy if exists item_bank_items_read on item_bank_items;
drop policy if exists screener_items_read on screener_items;
drop policy if exists scoring_config_read on scoring_config;

-- ── H5: one single-use invitation must yield at most one live booking ────────
-- The gist exclusion constraint only blocks OVERLAPPING ranges, so two
-- concurrent bookings on the same invite at different times both succeed. A
-- partial unique index on the invitation closes that race; the app already maps
-- 23505 → "that time was just taken."
create unique index if not exists interview_bookings_one_per_invitation
  on interview_bookings (invitation_id)
  where status in ('reserving', 'confirmed', 'calendar_pending', 'calendar_failed');

-- ── H6: a calendar_failed booking is still a real held interview ─────────────
-- It was excluded from the double-booking predicate, so a create_event failure
-- silently reopened the slot. Include it so the DB also blocks re-booking it.
alter table interview_bookings drop constraint if exists no_double_booking;
alter table interview_bookings add constraint no_double_booking exclude using gist (
  interviewer_id with =,
  tstzrange(start_at, end_at) with &&
) where (status in ('reserving', 'confirmed', 'calendar_pending', 'calendar_failed'));

-- ── H2: Stripe webhook idempotency ──────────────────────────────────────────
-- Stripe delivers events at-least-once and out of order; a stale
-- subscription.updated could regress a past_due org back to active. This table
-- lets the handler skip an event id it already processed.
create table if not exists stripe_events (
  id text primary key,
  type text,
  processed_at timestamptz not null default now()
);
alter table stripe_events enable row level security; -- service-role only

-- ── H3: in-app SMS opt-out (TCPA) ───────────────────────────────────────────
-- Persist STOP so the app honors opt-out itself instead of relying solely on
-- carrier-level 10DLC suppression.
-- A STOP applies to the phone number itself, so opt-out is keyed by phone
-- (global across orgs). org_id is kept for context only.
create table if not exists sms_opt_outs (
  phone text primary key,
  org_id uuid references organizations(id) on delete set null,
  opted_out_at timestamptz not null default now()
);
alter table sms_opt_outs enable row level security; -- service-role only
