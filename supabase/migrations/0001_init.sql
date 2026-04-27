-- 16 Handles New City — hiring portal schema
-- Single migration; idempotent so it can be re-run while iterating.

create extension if not exists "pgcrypto";

-- =====================================================================
-- Enums
-- =====================================================================
do $$ begin
  create type invitation_status as enum (
    'draft', 'sent', 'opened', 'started', 'submitted', 'expired'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type hiring_status as enum (
    'new', 'interview_requested', 'interviewed', 'rejected', 'hired'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type recommendation as enum (
    'strong_interview', 'interview', 'borderline', 'do_not_interview'
  );
exception when duplicate_object then null; end $$;

-- =====================================================================
-- admins
-- One row per Supabase Auth user that should have admin access.
-- Membership in this table is what grants admin privileges (RLS uses it).
-- =====================================================================
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- =====================================================================
-- invitations
-- =====================================================================
create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  -- Optional candidate info captured at invite time
  first_name text,
  last_name text,
  email text,
  phone text,
  notes text,
  status invitation_status not null default 'draft',
  expires_at timestamptz,
  sent_at timestamptz,
  opened_at timestamptz,
  started_at timestamptz,
  submitted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invitations_status_idx on invitations(status);
create index if not exists invitations_created_at_idx on invitations(created_at desc);

-- =====================================================================
-- applicants
-- One per submitted application (1:1 with invitations once submitted).
-- =====================================================================
create table if not exists applicants (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null unique references invitations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  age_band text, -- e.g. '16', '17', '18', '19', '20+'
  hiring_status hiring_status not null default 'new',
  total_score int,
  recommendation recommendation,
  category_scores jsonb not null default '{}'::jsonb, -- { ownership: 12, ... }
  risk_flags jsonb not null default '[]'::jsonb,      -- [{ key, label }]
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists applicants_total_score_idx on applicants(total_score desc nulls last);
create index if not exists applicants_recommendation_idx on applicants(recommendation);
create index if not exists applicants_hiring_status_idx on applicants(hiring_status);

-- =====================================================================
-- responses
-- Raw answers to each question, kept normalized for review/audit.
-- =====================================================================
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references applicants(id) on delete cascade,
  question_key text not null,
  answer jsonb not null, -- string | string[] | { value, text }
  created_at timestamptz not null default now(),
  unique (applicant_id, question_key)
);

-- =====================================================================
-- admin_notes
-- =====================================================================
create table if not exists admin_notes (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references applicants(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_email text,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists admin_notes_applicant_idx on admin_notes(applicant_id, created_at desc);

-- =====================================================================
-- audit_events (lightweight invitation activity log)
-- =====================================================================
create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references invitations(id) on delete cascade,
  applicant_id uuid references applicants(id) on delete cascade,
  kind text not null, -- 'invite.created' | 'invite.sent' | 'invite.opened' | ...
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_invitation_idx on audit_events(invitation_id, created_at desc);

-- =====================================================================
-- updated_at trigger for invitations
-- =====================================================================
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists invitations_set_updated_at on invitations;
create trigger invitations_set_updated_at
  before update on invitations
  for each row execute function set_updated_at();

-- =====================================================================
-- Row Level Security
-- All applicant-facing writes go through the service role (server actions).
-- Authenticated admins can read/write everything via the is_admin() check.
-- =====================================================================
alter table admins        enable row level security;
alter table invitations   enable row level security;
alter table applicants    enable row level security;
alter table responses     enable row level security;
alter table admin_notes   enable row level security;
alter table audit_events  enable row level security;

-- Admins: a user can see their own admin row (so the app can confirm
-- admin status from the browser). Only existing admins can grant new
-- admins.
drop policy if exists admins_self_read on admins;
create policy admins_self_read on admins
  for select using (auth.uid() = user_id or is_admin());

drop policy if exists admins_admin_write on admins;
create policy admins_admin_write on admins
  for all using (is_admin()) with check (is_admin());

-- Invitations / applicants / responses / notes / audit:
-- Admins-only via the dashboard. Public applicant flow uses the service
-- role from the server, which bypasses RLS.
drop policy if exists invitations_admin_all on invitations;
create policy invitations_admin_all on invitations
  for all using (is_admin()) with check (is_admin());

drop policy if exists applicants_admin_all on applicants;
create policy applicants_admin_all on applicants
  for all using (is_admin()) with check (is_admin());

drop policy if exists responses_admin_all on responses;
create policy responses_admin_all on responses
  for all using (is_admin()) with check (is_admin());

drop policy if exists admin_notes_admin_all on admin_notes;
create policy admin_notes_admin_all on admin_notes
  for all using (is_admin()) with check (is_admin());

drop policy if exists audit_events_admin_all on audit_events;
create policy audit_events_admin_all on audit_events
  for all using (is_admin()) with check (is_admin());
