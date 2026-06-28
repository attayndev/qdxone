-- ─────────────────────────────────────────────────────────────────────
-- Interview scheduling (native module). All tenant-scoped by org_id.
-- Concurrency: a gist EXCLUSION constraint on interview_bookings is the hard
-- double-booking guarantee (no two active bookings overlap for one interviewer);
-- the app layer also re-validates in a txn. Async work (calendar event create,
-- confirmations, reminders, reconciliation) goes through scheduling_jobs (a
-- transactional outbox) drained by a cron — never inline `after()`.
--
-- v1 = Google only, one interviewer per template, cancel-only (no reschedule).
-- The schema supports pools (interview_template_interviewers) + Microsoft +
-- reschedule (original_booking_id) so those land without migration churn.
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

create extension if not exists btree_gist;

-- OAuth calendar connections (one per member+provider). Tokens encrypted at the
-- app layer (AES-GCM, key from a wrangler secret); key_version enables rotation.
create table if not exists calendar_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  provider text not null check (provider in ('google', 'microsoft')),
  external_account_id text,
  enc_access_token text,
  enc_refresh_token text,
  enc_key_version int not null default 1,
  token_expires_at timestamptz,
  availability_calendar_id text,
  booking_calendar_id text,
  status text not null default 'connected'
    check (status in ('connected', 'expired', 'revoked')),
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id, provider)
);
create index if not exists idx_calconn_org on calendar_connections(org_id);

-- Reusable interview templates.
create table if not exists interview_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  job_posting_id uuid references job_postings(id) on delete set null,
  location_id uuid references locations(id) on delete set null,
  name text not null,
  duration_minutes int not null default 30,
  meeting_type text not null default 'in_person'
    check (meeting_type in
      ('in_person','phone','google_meet','teams','custom_video','custom_location')),
  assignment_type text not null default 'single'
    check (assignment_type in ('single','pool')),
  min_notice_minutes int not null default 240,
  max_advance_days int not null default 21,
  buffer_before_minutes int not null default 0,
  buffer_after_minutes int not null default 0,
  candidate_instructions text,
  interviewer_instructions text,
  meeting_location text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tmpl_org on interview_templates(org_id);

-- Interviewer roster for a template (pool-ready; v1 uses a single entry).
create table if not exists interview_template_interviewers (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references interview_templates(id) on delete cascade,
  user_id uuid not null,
  priority int not null default 0,
  is_active boolean not null default true,
  unique (template_id, user_id)
);

-- Recurring weekly availability (per interviewer; optionally template-specific).
create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  template_id uuid references interview_templates(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text not null,
  is_active boolean not null default true
);
create index if not exists idx_availrule_user on availability_rules(org_id, user_id);

-- Date-specific exceptions (time off, blackout, or an extra window).
create table if not exists availability_overrides (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  date date not null,
  start_time time,
  end_time time,
  is_unavailable boolean not null default true,
  reason text
);
create index if not exists idx_availovr_user on availability_overrides(org_id, user_id, date);

-- Secure, expiring scheduling invitations (the candidate gets a hashed token).
create table if not exists scheduling_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  application_id uuid not null references applications(id) on delete cascade,
  job_posting_id uuid references job_postings(id) on delete set null,
  template_id uuid not null references interview_templates(id) on delete cascade,
  assigned_interviewer_id uuid,
  token_hash text not null unique,
  expires_at timestamptz not null,
  status text not null default 'active'
    check (status in ('active','booked','revoked','expired')),
  max_bookings int not null default 1,
  created_by uuid,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists idx_invite_app on scheduling_invitations(org_id, application_id);

-- The booking. The exclusion constraint is the double-booking guarantee.
create table if not exists interview_bookings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  invitation_id uuid references scheduling_invitations(id) on delete set null,
  application_id uuid not null references applications(id) on delete cascade,
  template_id uuid references interview_templates(id) on delete set null,
  interviewer_id uuid not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null,
  status text not null default 'reserving'
    check (status in
      ('reserving','confirmed','calendar_pending','calendar_failed',
       'cancelled','completed','no_show')),
  meeting_type text,
  meeting_location text,
  conference_url text,
  external_calendar_provider text,
  external_calendar_event_id text,
  idempotency_key text unique,
  original_booking_id uuid references interview_bookings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancellation_reason text,
  -- No two ACTIVE bookings may overlap for the same interviewer.
  constraint no_double_booking exclude using gist (
    interviewer_id with =,
    tstzrange(start_at, end_at) with &&
  ) where (status in ('reserving','confirmed','calendar_pending'))
);
create index if not exists idx_booking_app on interview_bookings(org_id, application_id);

-- Transactional outbox: durable async work, drained by a cron (NOT inline).
create table if not exists scheduling_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  kind text not null
    check (kind in ('create_event','send_confirmation','send_reminder',
                    'cancel_event','reconcile')),
  booking_id uuid references interview_bookings(id) on delete cascade,
  run_after timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending','running','done','failed')),
  attempts int not null default 0,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_jobs_due on scheduling_jobs(status, run_after);

-- ─────────────────────────────────────────────────────────────────────
-- Row Level Security. All app access is via the service-role client
-- (adminClient(), which bypasses RLS) AFTER an app-level requireMembership()
-- check — same pattern as locations/job_postings/applications. RLS here is
-- the backstop that denies the anon/authenticated keys (which ship to the
-- browser) any direct access.
--
-- Org-scoped management tables mirror the existing is_org_member(org_id)
-- member-all policies. The two server-only tables — calendar_connections
-- (holds encrypted OAuth tokens) and scheduling_jobs (internal outbox) — get
-- RLS enabled with NO policy: deny-all to anon/authenticated, reachable only
-- by the service role. Idempotent.
-- ─────────────────────────────────────────────────────────────────────

alter table calendar_connections           enable row level security;
alter table interview_templates            enable row level security;
alter table interview_template_interviewers enable row level security;
alter table availability_rules             enable row level security;
alter table availability_overrides         enable row level security;
alter table scheduling_invitations         enable row level security;
alter table interview_bookings             enable row level security;
alter table scheduling_jobs                enable row level security;

-- calendar_connections + scheduling_jobs: intentionally NO policy (service-role only).

drop policy if exists interview_templates_member_all on interview_templates;
create policy interview_templates_member_all on interview_templates
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- Roster has no org_id; scope through its parent template.
drop policy if exists iti_member_all on interview_template_interviewers;
create policy iti_member_all on interview_template_interviewers
  for all using (exists (
    select 1 from interview_templates t
    where t.id = template_id and is_org_member(t.org_id)))
  with check (exists (
    select 1 from interview_templates t
    where t.id = template_id and is_org_member(t.org_id)));

drop policy if exists availability_rules_member_all on availability_rules;
create policy availability_rules_member_all on availability_rules
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

drop policy if exists availability_overrides_member_all on availability_overrides;
create policy availability_overrides_member_all on availability_overrides
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

drop policy if exists scheduling_invitations_member_all on scheduling_invitations;
create policy scheduling_invitations_member_all on scheduling_invitations
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

drop policy if exists interview_bookings_member_all on interview_bookings;
create policy interview_bookings_member_all on interview_bookings
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
