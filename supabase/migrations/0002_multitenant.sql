-- ─────────────────────────────────────────────────────────────────────
-- Phase 1: multi-tenant migration
-- ─────────────────────────────────────────────────────────────────────
-- Adds organizations, members, test types, usage events.
-- Backfills 16 Handles New City as the first org and stamps every
-- existing row with its org_id.
--
-- Idempotent: re-runs cleanly while iterating.
-- ─────────────────────────────────────────────────────────────────────

-- =====================================================================
-- Enums
-- =====================================================================
do $$ begin
  create type plan_tier as enum ('trial', 'starter', 'growth', 'canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type billing_cycle as enum ('annual', 'monthly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type org_role as enum ('owner', 'admin');
exception when duplicate_object then null; end $$;

-- Test type identity. Add new ones as features ship; the questionnaire
-- is the core type and is included in every plan.
do $$ begin
  create type test_type_key as enum (
    'questionnaire', 'cashier_math', 'iq'
  );
exception when duplicate_object then null; end $$;

-- =====================================================================
-- organizations
-- =====================================================================
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                    -- subdomain on *.qdx.one
  name text not null,
  -- Branding / wording — read on every applicant page render.
  branding jsonb not null default '{}'::jsonb,
  -- Plan + billing
  plan plan_tier not null default 'trial',
  billing_cycle billing_cycle,                  -- null for trial
  trial_ends_at timestamptz,
  -- Stripe
  stripe_customer_id text,
  stripe_subscription_id text,
  -- Soft-delete / suspension
  status text not null default 'active',        -- 'active' | 'past_due' | 'canceled' | 'suspended'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_status_idx on organizations(status);
create index if not exists organizations_stripe_customer_idx on organizations(stripe_customer_id);

drop trigger if exists organizations_set_updated_at on organizations;
create trigger organizations_set_updated_at
  before update on organizations
  for each row execute function set_updated_at();

-- =====================================================================
-- org_members
-- One Supabase user can belong to (own/admin) multiple orgs in theory.
-- =====================================================================
create table if not exists org_members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null default 'admin',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists org_members_user_idx on org_members(user_id);

-- Convenience helpers
create or replace function is_org_member(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from org_members
    where org_id = p_org and user_id = auth.uid()
  );
$$;

create or replace function is_org_owner(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from org_members
    where org_id = p_org and user_id = auth.uid() and role = 'owner'
  );
$$;

-- =====================================================================
-- org_test_types
-- Per-org enrollment in a test type, with quota and overage price.
-- The questionnaire row is auto-created for every org.
-- =====================================================================
create table if not exists org_test_types (
  org_id uuid not null references organizations(id) on delete cascade,
  type_key test_type_key not null,
  monthly_quota int not null default 0,         -- included tests/month
  overage_unit_cents int not null default 0,    -- $ per overage test
  stripe_subscription_item_id text,             -- for metered reporting
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (org_id, type_key)
);

-- =====================================================================
-- usage_events
-- One row per billable event (currently: completed application).
-- Used for the in-app usage view and for nightly Stripe reporting.
-- =====================================================================
create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  type_key test_type_key not null default 'questionnaire',
  applicant_id uuid references applicants(id) on delete set null,
  -- billing_period_start anchors the row to a month for easy grouping.
  billing_period_start date not null default date_trunc('month', now())::date,
  is_overage boolean not null default false,
  reported_to_stripe boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists usage_events_org_period_idx
  on usage_events(org_id, billing_period_start, type_key);
create index if not exists usage_events_unreported_idx
  on usage_events(reported_to_stripe) where reported_to_stripe = false;

-- =====================================================================
-- Add org_id to existing tables
-- =====================================================================
alter table invitations  add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table applicants   add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table responses    add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table admin_notes  add column if not exists org_id uuid references organizations(id) on delete cascade;
alter table audit_events add column if not exists org_id uuid references organizations(id) on delete cascade;

create index if not exists invitations_org_idx  on invitations(org_id, created_at desc);
create index if not exists applicants_org_idx   on applicants(org_id, submitted_at desc);
create index if not exists responses_org_idx    on responses(org_id);
create index if not exists admin_notes_org_idx  on admin_notes(org_id);
create index if not exists audit_events_org_idx on audit_events(org_id);

-- =====================================================================
-- Backfill: 16 Handles New City as the first org. Idempotent.
-- =====================================================================
insert into organizations (id, slug, name, branding, plan, billing_cycle, status)
values (
  '00000000-0000-0000-0000-000000000001',
  '16handlesnewcity',
  '16 Handles New City',
  jsonb_build_object(
    'display_name', '16 Handles',
    'location_subtitle', 'New City',
    'hero_copy_eyebrow', 'Now hiring · New City, NY',
    'hero_copy_h1_pre', 'Scoop joy.',
    'hero_copy_h1_post', 'Earn it.',
    'industry', 'froyo',
    'primary_color', '#ff2d87',
    'phone_policy_enabled', true,
    'phone_policy_text',
      'Phones live in the manager''s office during your shift. Phone use on the floor is a firing offense — no exceptions.'
  ),
  'starter',
  'annual',
  'active'
)
on conflict (id) do nothing;

-- Backfill org_id on every existing row to the seeded org.
update invitations  set org_id = '00000000-0000-0000-0000-000000000001' where org_id is null;
update applicants   set org_id = '00000000-0000-0000-0000-000000000001' where org_id is null;
update responses    set org_id = '00000000-0000-0000-0000-000000000001' where org_id is null;
update admin_notes  set org_id = '00000000-0000-0000-0000-000000000001' where org_id is null;
update audit_events set org_id = '00000000-0000-0000-0000-000000000001' where org_id is null;

-- Now enforce NOT NULL on the org-scoped tables.
alter table invitations  alter column org_id set not null;
alter table applicants   alter column org_id set not null;
alter table responses    alter column org_id set not null;
alter table admin_notes  alter column org_id set not null;
-- audit_events keeps org_id nullable (some events may be platform-level).

-- Promote any existing admins to owners of the seeded org.
insert into org_members (org_id, user_id, role)
select '00000000-0000-0000-0000-000000000001', user_id, 'owner'
from admins
on conflict (org_id, user_id) do nothing;

-- Seed the questionnaire test type for the org. Starter plan = 10/mo, $3 overage.
insert into org_test_types (org_id, type_key, monthly_quota, overage_unit_cents, enabled)
values (
  '00000000-0000-0000-0000-000000000001',
  'questionnaire',
  10,
  300,
  true
)
on conflict (org_id, type_key) do nothing;

-- =====================================================================
-- Row Level Security — rewrite for multi-tenant
-- =====================================================================
alter table organizations    enable row level security;
alter table org_members      enable row level security;
alter table org_test_types   enable row level security;
alter table usage_events     enable row level security;

-- organizations: members can read their own orgs; owners can update.
drop policy if exists organizations_member_read on organizations;
create policy organizations_member_read on organizations
  for select using (is_org_member(id));

drop policy if exists organizations_owner_write on organizations;
create policy organizations_owner_write on organizations
  for update using (is_org_owner(id)) with check (is_org_owner(id));

-- org_members: a user sees their own memberships; owners manage all in their org.
drop policy if exists org_members_self_read on org_members;
create policy org_members_self_read on org_members
  for select using (auth.uid() = user_id or is_org_owner(org_id));

drop policy if exists org_members_owner_write on org_members;
create policy org_members_owner_write on org_members
  for all using (is_org_owner(org_id)) with check (is_org_owner(org_id));

-- org_test_types: members read; owners write.
drop policy if exists org_test_types_member_read on org_test_types;
create policy org_test_types_member_read on org_test_types
  for select using (is_org_member(org_id));

drop policy if exists org_test_types_owner_write on org_test_types;
create policy org_test_types_owner_write on org_test_types
  for all using (is_org_owner(org_id)) with check (is_org_owner(org_id));

-- usage_events: members read.
drop policy if exists usage_events_member_read on usage_events;
create policy usage_events_member_read on usage_events
  for select using (is_org_member(org_id));

-- Replace the old admin-only policies on data tables with org-scoped policies.
drop policy if exists invitations_admin_all on invitations;
create policy invitations_member_all on invitations
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

drop policy if exists applicants_admin_all on applicants;
create policy applicants_member_all on applicants
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

drop policy if exists responses_admin_all on responses;
create policy responses_member_all on responses
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

drop policy if exists admin_notes_admin_all on admin_notes;
create policy admin_notes_member_all on admin_notes
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

drop policy if exists audit_events_admin_all on audit_events;
create policy audit_events_member_all on audit_events
  for all using (org_id is null or is_org_member(org_id))
  with check (org_id is null or is_org_member(org_id));
