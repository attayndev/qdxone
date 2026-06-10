-- ─────────────────────────────────────────────────────────────────────
-- Phase 1: intake-platform pivot
-- ─────────────────────────────────────────────────────────────────────
-- Reshapes the product from per-candidate invitations into an inbound
-- intake platform: location → job posting → application → assessment.
--
--   • Location as a first-class entity (org → location; multi-unit later)
--   • Assessment sessions are SUBJECT-AGNOSTIC (candidate | incumbent) so
--     Module H (incumbent benchmarking, Phase 2) reuses the same engine.
--   • Versioned methodology: item bank + screener + taxonomy + scoring
--     rules, stamped onto every assessment. Seeded with v0.3 content.
--   • Two locked partitions: eeo (Module D/G) and benchmark (Module H).
--   • Append-only audit_log.
--
-- Legacy invitation-era tables (invitations, applicants, responses,
-- admin_notes) are left in place, unused by the new flow. Drop in a
-- later migration once the new pipeline is verified.
--
-- Idempotent: re-runs cleanly while iterating.
-- ─────────────────────────────────────────────────────────────────────

-- =====================================================================
-- Enums
-- =====================================================================
do $$ begin create type location_role_type as enum ('crew','shift_lead','gm');
exception when duplicate_object then null; end $$;

do $$ begin create type job_posting_status as enum ('draft','open','closed');
exception when duplicate_object then null; end $$;

do $$ begin create type application_status as enum
  ('new','assessment_sent','assessment_complete','decision_made');
exception when duplicate_object then null; end $$;

-- How a candidate entered the pipeline. 'job_posting' = filled the full
-- QDX application; 'standalone' = operator sent an assessment to a contact
-- (applied via Indeed/paper/referral/walk-in) with only name + email[+phone].
do $$ begin create type application_entry_source as enum ('job_posting','standalone');
exception when duplicate_object then null; end $$;

do $$ begin create type assessment_subject_type as enum ('candidate','incumbent');
exception when duplicate_object then null; end $$;

do $$ begin create type assessment_status as enum
  ('sent','in_progress','complete','expired');
exception when duplicate_object then null; end $$;

do $$ begin create type assessment_item_kind as enum
  ('personality','screener','attention_check');
exception when duplicate_object then null; end $$;

do $$ begin create type methodology_status as enum ('draft','active','retired');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- locations  (org → location; single-unit UI in MVP, modeled for multi)
-- =====================================================================
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists locations_org_idx on locations(org_id);
drop trigger if exists locations_set_updated_at on locations;
create trigger locations_set_updated_at before update on locations
  for each row execute function set_updated_at();

-- =====================================================================
-- job_postings  (public shareable link + QR target)
-- =====================================================================
create table if not exists job_postings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  -- location_id set  → single-store posting (the franchisee case).
  -- location_id null → org-wide careers page; the applicant chooses a
  --   location at apply time (the brand case, e.g. 16Handles corporate).
  -- Either way, the resolved location lands on applications.location_id.
  location_id uuid references locations(id) on delete cascade,
  title text not null,
  role_type location_role_type not null default 'crew',
  public_token text not null unique,
  status job_posting_status not null default 'open',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists job_postings_org_idx on job_postings(org_id, created_at desc);
create index if not exists job_postings_location_idx on job_postings(location_id);
drop trigger if exists job_postings_set_updated_at on job_postings;
create trigger job_postings_set_updated_at before update on job_postings
  for each row execute function set_updated_at();

-- =====================================================================
-- applications  (inbound, self-serve; replaces invitation entry point)
-- =====================================================================
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  job_posting_id uuid references job_postings(id) on delete set null,
  -- 'standalone' rows are the minimal contact captured to send an
  -- assessment outside the job-application flow; the Module B fields below
  -- stay empty for them.
  entry_source application_entry_source not null default 'job_posting',
  -- contact (the minimum required to send an assessment)
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,                                        -- optional (SMS delivery)
  postal_code text,
  -- application fields (Module B template)
  eligible_to_work boolean,
  availability jsonb not null default '{}'::jsonb,  -- day-of-week × time grid
  work_history jsonb not null default '[]'::jsonb,  -- last 2 jobs (optional)
  job_references jsonb not null default '[]'::jsonb, -- optional
  positions text[] not null default '{}',
  earliest_start_date date,
  resume_url text,                                   -- private Vercel Blob (optional)
  status application_status not null default 'new',
  -- resume_token: powers the assessment link AND the no-account status page
  resume_token text not null unique,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists applications_org_idx on applications(org_id, submitted_at desc);
create index if not exists applications_posting_idx on applications(job_posting_id);
create index if not exists applications_status_idx on applications(org_id, status);
drop trigger if exists applications_set_updated_at on applications;
create trigger applications_set_updated_at before update on applications
  for each row execute function set_updated_at();

-- =====================================================================
-- methodology_versions  (versioned item bank / screener / scoring)
-- Every assessment_session stamps the version it was taken under.
-- =====================================================================
create table if not exists methodology_versions (
  version text primary key,
  label text not null,
  status methodology_status not null default 'draft',
  notes text,
  io_psych_signoff_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists assessment_taxonomy (
  version text not null references methodology_versions(version) on delete cascade,
  category_academic text not null,
  category_ui text not null,
  facet text not null,
  definition text,
  why_it_matters text,
  outcomes_predicted text,
  item_count int,
  sort_order int not null default 0,
  primary key (version, category_academic, facet)
);

create table if not exists item_bank_items (
  version text not null references methodology_versions(version) on delete cascade,
  item_id text not null,
  category_academic text not null,
  category_ui text not null,
  facet text not null,
  item_text text not null,
  keying text not null check (keying in ('positive','reverse')),
  item_kind assessment_item_kind not null default 'personality',
  notes text,
  sort_order int not null default 0,
  primary key (version, item_id)
);

create table if not exists screener_items (
  version text not null references methodology_versions(version) on delete cascade,
  item_id text not null,
  question text not null,
  format text not null,            -- 'single_select' | 'free_text'
  options jsonb,                   -- [{value,label}] for single_select
  scoring_note text,
  sort_order int not null default 0,
  primary key (version, item_id)
);

create table if not exists scoring_config (
  version text primary key references methodology_versions(version) on delete cascade,
  config jsonb not null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- assessment_sessions  (SUBJECT-AGNOSTIC: candidate or incumbent)
-- Candidate sessions link to an application. Incumbent sessions (Phase 2,
-- Module H) link to an incumbent invite — column added then. Incumbent
-- rows are never visible to operators (RLS below); only aggregates in the
-- benchmark schema surface.
-- =====================================================================
create table if not exists assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  location_id uuid references locations(id) on delete set null,
  subject_type assessment_subject_type not null default 'candidate',
  application_id uuid references applications(id) on delete cascade,
  methodology_version text not null references methodology_versions(version),
  -- The fixed 25-question subset assigned to THIS session, stratified from
  -- the (growing) item bank: ~3 scored items/facet + keying balance + woven
  -- attention checks. Stored so resume, rendering, and scoring all agree on
  -- the form the candidate actually saw. Count stays 25 as the bank grows.
  form_item_ids text[] not null default '{}',
  status assessment_status not null default 'sent',
  delivery_channels text[] not null default '{}',   -- 'email' | 'sms'
  access_token text not null unique,                 -- 72h assessment link
  expires_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assessment_sessions_org_idx on assessment_sessions(org_id);
create index if not exists assessment_sessions_application_idx on assessment_sessions(application_id);
create index if not exists assessment_sessions_subject_idx on assessment_sessions(org_id, subject_type);
drop trigger if exists assessment_sessions_set_updated_at on assessment_sessions;
create trigger assessment_sessions_set_updated_at before update on assessment_sessions
  for each row execute function set_updated_at();

-- =====================================================================
-- assessment_responses  (raw capture; per-item timing for careless checks)
-- No scoring in Phase 1 — values are stored verbatim.
-- =====================================================================
create table if not exists assessment_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references assessment_sessions(id) on delete cascade,
  item_id text not null,
  item_kind assessment_item_kind not null default 'personality',
  value_int int,           -- 1-5 Likert, or selected option for screener
  value_text text,         -- free-text screener (MOT-02)
  response_ms int,         -- per-item latency (flag < 1500ms)
  sequence int,            -- presentation order (pattern checks)
  created_at timestamptz not null default now(),
  unique (session_id, item_id)
);
create index if not exists assessment_responses_session_idx on assessment_responses(session_id);

-- =====================================================================
-- audit_log  (append-only: immutable decision/score/override trail)
-- =====================================================================
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  subject_type text,
  subject_id uuid,
  reason_code text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_org_idx on audit_log(org_id, created_at desc);
create index if not exists audit_log_subject_idx on audit_log(subject_type, subject_id);

-- Block any UPDATE/DELETE on audit_log — append-only by construction.
create or replace function audit_log_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_log is append-only; % is not permitted', tg_op;
end $$;
drop trigger if exists audit_log_no_update on audit_log;
create trigger audit_log_no_update before update on audit_log
  for each row execute function audit_log_immutable();
drop trigger if exists audit_log_no_delete on audit_log;
create trigger audit_log_no_delete before delete on audit_log
  for each row execute function audit_log_immutable();

-- =====================================================================
-- Partition 1: eeo schema  (Module D/G)
-- Locked: RLS on, NO policies, usage revoked from app roles. Only the
-- service role (server-side) and future security-definer aggregate
-- functions touch it. Decision-makers can never read individual rows.
-- =====================================================================
create schema if not exists eeo;

create table if not exists eeo.responses (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  declined boolean not null default false,
  race_ethnicity text,        -- OMB-standard category code
  gender text,
  veteran_status text,        -- VEVRAA category
  disability_status text,     -- Section 503 form value
  submitted_at timestamptz not null default now()
);
create index if not exists eeo_responses_org_idx on eeo.responses(org_id);
alter table eeo.responses enable row level security;
-- No policies = no access for anon/authenticated even with schema usage.
revoke all on schema eeo from anon, authenticated;
revoke all on all tables in schema eeo from anon, authenticated;

-- =====================================================================
-- Partition 2: benchmark schema  (Module H)
-- Operator-readable AGGREGATE norms only. Individual incumbent results
-- live in assessment_sessions (subject_type='incumbent') and are hidden
-- from operators by RLS; only these aggregates surface.
-- =====================================================================
create schema if not exists benchmark;
grant usage on schema benchmark to authenticated;

create table if not exists benchmark.norms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  location_id uuid references locations(id) on delete cascade,
  methodology_version text not null,
  tier int not null,                 -- 1 raw | 2 local | 3 cross-operator
  scope text not null,               -- 'category' | 'facet'
  scope_key text not null,           -- category_academic or facet name
  sample_n int not null default 0,
  cutoffs jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);
create index if not exists benchmark_norms_org_idx on benchmark.norms(org_id, methodology_version);
alter table benchmark.norms enable row level security;
drop policy if exists benchmark_norms_member_read on benchmark.norms;
create policy benchmark_norms_member_read on benchmark.norms
  for select using (is_org_member(org_id));

-- =====================================================================
-- Row Level Security — new public tables
-- Operator-facing access is org-scoped via is_org_member(). Public
-- candidate writes go through the service role (server actions), which
-- bypasses RLS, exactly as the legacy flow did.
-- =====================================================================
alter table locations            enable row level security;
alter table job_postings         enable row level security;
alter table applications         enable row level security;
alter table assessment_sessions  enable row level security;
alter table assessment_responses enable row level security;
alter table audit_log            enable row level security;
alter table methodology_versions enable row level security;
alter table assessment_taxonomy  enable row level security;
alter table item_bank_items      enable row level security;
alter table screener_items       enable row level security;
alter table scoring_config       enable row level security;

drop policy if exists locations_member_all on locations;
create policy locations_member_all on locations
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

drop policy if exists job_postings_member_all on job_postings;
create policy job_postings_member_all on job_postings
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

drop policy if exists applications_member_all on applications;
create policy applications_member_all on applications
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- Operators see CANDIDATE sessions only. Incumbent sessions are service-
-- role only (their individual data must never surface to managers).
drop policy if exists assessment_sessions_member_read on assessment_sessions;
create policy assessment_sessions_member_read on assessment_sessions
  for select using (is_org_member(org_id) and subject_type = 'candidate');

drop policy if exists assessment_responses_member_read on assessment_responses;
create policy assessment_responses_member_read on assessment_responses
  for select using (exists (
    select 1 from assessment_sessions s
    where s.id = assessment_responses.session_id
      and is_org_member(s.org_id)
      and s.subject_type = 'candidate'
  ));

-- audit_log: members read their org's trail; inserts are service-role
-- only (no member insert policy); update/delete blocked by trigger above.
drop policy if exists audit_log_member_read on audit_log;
create policy audit_log_member_read on audit_log
  for select using (is_org_member(org_id));

-- Versioned methodology content is non-sensitive; any authenticated
-- member may read. Writes are service-role only (no write policy).
drop policy if exists methodology_versions_read on methodology_versions;
create policy methodology_versions_read on methodology_versions for select using (true);
drop policy if exists assessment_taxonomy_read on assessment_taxonomy;
create policy assessment_taxonomy_read on assessment_taxonomy for select using (true);
drop policy if exists item_bank_items_read on item_bank_items;
create policy item_bank_items_read on item_bank_items for select using (true);
drop policy if exists screener_items_read on screener_items;
create policy screener_items_read on screener_items for select using (true);
drop policy if exists scoring_config_read on scoring_config;
create policy scoring_config_read on scoring_config for select using (true);


-- =====================================================================
-- Seed: methodology v0.3  (from QDX_One_Assessment_v0.3.xlsx)
-- DRAFT — pending I/O psych review and validation pilot.
-- =====================================================================
insert into methodology_versions (version, label, status, notes) values
  ('v0.3', 'QDX One Assessment v0.3', 'draft',
   '4 categories, 8 facets, 83 personality items + 5-item motivation screener. Dual-labeled. Pending I/O psych review and pilot (N>=300). Reading level unverified. Screener framings are EEOC-sensitive — do not modify without legal review.')
on conflict (version) do update set label=excluded.label, notes=excluded.notes;


-- taxonomy (dual labels + facet metadata)
insert into assessment_taxonomy (version, category_academic, category_ui, facet, definition, why_it_matters, outcomes_predicted, item_count, sort_order) values ('v0.3', 'Conscientiousness', 'Reliability & Drive', 'Dependability', 'Tendency to show up, follow through, and be where you said you''d be.', 'Operators'' #1 hiring pain (no-call/no-show). Single best non-cognitive predictor of attendance and tenure.', 'Attendance, 90-day retention', 10, 0) on conflict (version, category_academic, facet) do update set definition=excluded.definition, item_count=excluded.item_count, sort_order=excluded.sort_order;
insert into assessment_taxonomy (version, category_academic, category_ui, facet, definition, why_it_matters, outcomes_predicted, item_count, sort_order) values ('v0.3', 'Conscientiousness', 'Reliability & Drive', 'Achievement', 'Drive to do good work, improve, and meet personal standards.', 'Predicts who promotes from crew to lead. Distinguishes effort-grade employees from coasters.', 'Promotability, customer service quality, retention', 12, 1) on conflict (version, category_academic, facet) do update set definition=excluded.definition, item_count=excluded.item_count, sort_order=excluded.sort_order;
insert into assessment_taxonomy (version, category_academic, category_ui, facet, definition, why_it_matters, outcomes_predicted, item_count, sort_order) values ('v0.3', 'Agreeableness', 'People Skills', 'Customer Warmth', 'Genuine interest in helping people and warmth — not just polite efficiency.', 'Frontline QSR is emotional labor. Warmth differentiates ''fine'' service from memorable service.', 'Customer service quality, retention', 12, 2) on conflict (version, category_academic, facet) do update set definition=excluded.definition, item_count=excluded.item_count, sort_order=excluded.sort_order;
insert into assessment_taxonomy (version, category_academic, category_ui, facet, definition, why_it_matters, outcomes_predicted, item_count, sort_order) values ('v0.3', 'Agreeableness', 'People Skills', 'Team Cooperation', 'Willingness to help coworkers and prioritize team success over individual credit.', 'QSR shifts run on coordination. Cooperation drives low-drama shifts and crew retention.', 'Service quality, promotability, crew retention', 12, 3) on conflict (version, category_academic, facet) do update set definition=excluded.definition, item_count=excluded.item_count, sort_order=excluded.sort_order;
insert into assessment_taxonomy (version, category_academic, category_ui, facet, definition, why_it_matters, outcomes_predicted, item_count, sort_order) values ('v0.3', 'Agreeableness', 'People Skills', 'Coachability', 'Non-defensiveness when corrected; receptiveness to feedback and instruction.', 'Single biggest predictor of how fast someone improves. The behavioral expression of ''good attitude.''', 'Promotability, learns fast, service quality over time', 6, 4) on conflict (version, category_academic, facet) do update set definition=excluded.definition, item_count=excluded.item_count, sort_order=excluded.sort_order;
insert into assessment_taxonomy (version, category_academic, category_ui, facet, definition, why_it_matters, outcomes_predicted, item_count, sort_order) values ('v0.3', 'Self-Direction', 'Ownership', 'Internal Locus of Control', 'Belief that one''s own effort and choices — not luck or external forces — drive outcomes.', 'Predicts coachability, ownership of mistakes, willingness to develop.', 'Promotability, retention, attendance', 10, 5) on conflict (version, category_academic, facet) do update set definition=excluded.definition, item_count=excluded.item_count, sort_order=excluded.sort_order;
insert into assessment_taxonomy (version, category_academic, category_ui, facet, definition, why_it_matters, outcomes_predicted, item_count, sort_order) values ('v0.3', 'Self-Direction', 'Ownership', 'Initiative & Ownership', 'Self-starting behavior — sees what needs doing and does it; owns mistakes without deflecting.', 'Distinct from LoC (a belief); this is the behavior pattern. Strongest predictor of supervisor performance ratings.', 'Promotability, service quality, retention', 11, 6) on conflict (version, category_academic, facet) do update set definition=excluded.definition, item_count=excluded.item_count, sort_order=excluded.sort_order;
insert into assessment_taxonomy (version, category_academic, category_ui, facet, definition, why_it_matters, outcomes_predicted, item_count, sort_order) values ('v0.3', 'Emotional Stability', 'Composure', 'Composure', 'Ability to stay composed under pressure and recover from setbacks without rumination.', 'Rush periods and rude customers are constant. Emotionally reactive employees burn out and quit.', 'Retention, customer service quality', 10, 7) on conflict (version, category_academic, facet) do update set definition=excluded.definition, item_count=excluded.item_count, sort_order=excluded.sort_order;

-- personality item bank (83 items)
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'DEP-01', 'Conscientiousness', 'Reliability & Drive', 'Dependability', 'I show up on time, even when I don''t feel like going.', 'positive', 'personality', null, 0) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'DEP-02', 'Conscientiousness', 'Reliability & Drive', 'Dependability', 'When I commit to a shift, I find a way to be there.', 'positive', 'personality', null, 1) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'DEP-03', 'Conscientiousness', 'Reliability & Drive', 'Dependability', 'I finish what I start, even when it gets boring.', 'positive', 'personality', null, 2) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'DEP-04', 'Conscientiousness', 'Reliability & Drive', 'Dependability', 'People can count on me to do what I said I would do.', 'positive', 'personality', null, 3) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'DEP-05', 'Conscientiousness', 'Reliability & Drive', 'Dependability', 'I keep track of my schedule carefully.', 'positive', 'personality', null, 4) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'DEP-06', 'Conscientiousness', 'Reliability & Drive', 'Dependability', 'I sometimes call out of work when I could have made it.', 'reverse', 'personality', 'Reverse. Watch for socially desirable responding.', 5) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'DEP-07', 'Conscientiousness', 'Reliability & Drive', 'Dependability', 'I lose track of small tasks if no one reminds me.', 'reverse', 'personality', 'Reverse.', 6) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'DEP-08', 'Conscientiousness', 'Reliability & Drive', 'Dependability', 'I run late more often than I''d like.', 'reverse', 'personality', 'Reverse.', 7) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'DEP-09', 'Conscientiousness', 'Reliability & Drive', 'Dependability', 'I put off things I don''t enjoy doing.', 'reverse', 'personality', 'Reverse.', 8) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'DEP-10', 'Conscientiousness', 'Reliability & Drive', 'Dependability', 'If something better comes up, I''ll skip my plans.', 'reverse', 'personality', 'Reverse.', 9) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LRN-01', 'Conscientiousness', 'Reliability & Drive', 'Achievement', 'I like learning how to do things better.', 'positive', 'personality', 'Reassigned from Learning Orientation.', 10) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LRN-03', 'Conscientiousness', 'Reliability & Drive', 'Achievement', 'I look for ways to improve at my job.', 'positive', 'personality', 'Reassigned from Learning Orientation.', 11) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LRN-04', 'Conscientiousness', 'Reliability & Drive', 'Achievement', 'I enjoy taking on new responsibilities.', 'positive', 'personality', 'Reassigned from Learning Orientation.', 12) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LRN-06', 'Conscientiousness', 'Reliability & Drive', 'Achievement', 'Once I''ve learned the basics of a job, I''m done learning.', 'reverse', 'personality', 'Reverse. Reassigned from Learning Orientation.', 13) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LRN-07', 'Conscientiousness', 'Reliability & Drive', 'Achievement', 'I''d rather do tasks I''m already good at than try new ones.', 'reverse', 'personality', 'Reverse. Reassigned from Learning Orientation.', 14) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LRN-09', 'Conscientiousness', 'Reliability & Drive', 'Achievement', 'I don''t see the point of learning things outside my current job.', 'reverse', 'personality', 'Reverse. Reassigned from Learning Orientation.', 15) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'ACH-01', 'Conscientiousness', 'Reliability & Drive', 'Achievement', 'Being good at my job matters to me.', 'positive', 'personality', 'NEW v0.3.', 16) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'ACH-02', 'Conscientiousness', 'Reliability & Drive', 'Achievement', 'I push myself to get better at what I do.', 'positive', 'personality', 'NEW v0.3.', 17) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'ACH-03', 'Conscientiousness', 'Reliability & Drive', 'Achievement', 'I set goals for myself even when no one else does.', 'positive', 'personality', 'NEW v0.3.', 18) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'ACH-04', 'Conscientiousness', 'Reliability & Drive', 'Achievement', 'I take pride in doing my work well.', 'positive', 'personality', 'NEW v0.3.', 19) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'ACH-05', 'Conscientiousness', 'Reliability & Drive', 'Achievement', 'I want to keep improving, not just stay where I am.', 'positive', 'personality', 'NEW v0.3.', 20) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'ACH-06', 'Conscientiousness', 'Reliability & Drive', 'Achievement', 'Doing ''good enough'' is fine with me.', 'reverse', 'personality', 'Reverse. NEW v0.3.', 21) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'CUS-01', 'Agreeableness', 'People Skills', 'Customer Warmth', 'I enjoy helping people, even strangers.', 'positive', 'personality', null, 22) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'CUS-02', 'Agreeableness', 'People Skills', 'Customer Warmth', 'Making someone''s day a little better feels good to me.', 'positive', 'personality', null, 23) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'CUS-03', 'Agreeableness', 'People Skills', 'Customer Warmth', 'I try to be friendly even when I''m tired.', 'positive', 'personality', null, 24) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'CUS-04', 'Agreeableness', 'People Skills', 'Customer Warmth', 'I notice when someone seems frustrated and try to help.', 'positive', 'personality', null, 25) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'CUS-05', 'Agreeableness', 'People Skills', 'Customer Warmth', 'I want customers to leave happier than they came in.', 'positive', 'personality', null, 26) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'CUS-06', 'Agreeableness', 'People Skills', 'Customer Warmth', 'Some customers don''t deserve good service.', 'reverse', 'personality', 'Reverse.', 27) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'CUS-07', 'Agreeableness', 'People Skills', 'Customer Warmth', 'It''s hard for me to be polite when people are rude.', 'reverse', 'personality', 'Reverse.', 28) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'CUS-08', 'Agreeableness', 'People Skills', 'Customer Warmth', 'I''d rather work alone than deal with the public.', 'reverse', 'personality', 'Reverse. Job-fit signal.', 29) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'CUS-09', 'Agreeableness', 'People Skills', 'Customer Warmth', 'Helping difficult people drains me.', 'reverse', 'personality', 'Reverse.', 30) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'CUS-10', 'Agreeableness', 'People Skills', 'Customer Warmth', 'When customers complain, my first thought is that they''re being unreasonable.', 'reverse', 'personality', 'Reverse.', 31) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'CUS-11', 'Agreeableness', 'People Skills', 'Customer Warmth', 'I like striking up small conversations with people I''m helping.', 'positive', 'personality', null, 32) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'CUS-12', 'Agreeableness', 'People Skills', 'Customer Warmth', 'I make eye contact and smile, even with strangers.', 'positive', 'personality', null, 33) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'TEA-01', 'Agreeableness', 'People Skills', 'Team Cooperation', 'I pitch in to help coworkers without being asked.', 'positive', 'personality', null, 34) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'TEA-02', 'Agreeableness', 'People Skills', 'Team Cooperation', 'I''d rather a team win than get personal credit.', 'positive', 'personality', null, 35) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'TEA-03', 'Agreeableness', 'People Skills', 'Team Cooperation', 'I cover for teammates when they need it.', 'positive', 'personality', null, 36) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'TEA-04', 'Agreeableness', 'People Skills', 'Team Cooperation', 'I share information that might help my coworkers.', 'positive', 'personality', null, 37) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'TEA-05', 'Agreeableness', 'People Skills', 'Team Cooperation', 'When the team is short-staffed, I step up.', 'positive', 'personality', null, 38) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'TEA-06', 'Agreeableness', 'People Skills', 'Team Cooperation', 'I focus on my own tasks and let others handle theirs.', 'reverse', 'personality', 'Reverse.', 39) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'TEA-07', 'Agreeableness', 'People Skills', 'Team Cooperation', 'It''s not my job to clean up after coworkers.', 'reverse', 'personality', 'Reverse.', 40) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'TEA-08', 'Agreeableness', 'People Skills', 'Team Cooperation', 'I work better when I don''t have to coordinate with others.', 'reverse', 'personality', 'Reverse.', 41) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'TEA-09', 'Agreeableness', 'People Skills', 'Team Cooperation', 'Other people''s problems are not my responsibility at work.', 'reverse', 'personality', 'Reverse.', 42) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'TEA-10', 'Agreeableness', 'People Skills', 'Team Cooperation', 'I don''t go out of my way to help people who haven''t helped me.', 'reverse', 'personality', 'Reverse.', 43) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'TEA-11', 'Agreeableness', 'People Skills', 'Team Cooperation', 'I take time to ask coworkers how they''re doing.', 'positive', 'personality', 'Crew warmth tone.', 44) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'TEA-12', 'Agreeableness', 'People Skills', 'Team Cooperation', 'I want my coworkers to enjoy their shifts as much as possible.', 'positive', 'personality', 'Crew warmth tone.', 45) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LRN-02', 'Agreeableness', 'People Skills', 'Coachability', 'I ask questions when I don''t understand something.', 'positive', 'personality', 'Reassigned from Learning Orientation.', 46) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LRN-05', 'Agreeableness', 'People Skills', 'Coachability', 'Mistakes are how I figure out what to do differently.', 'positive', 'personality', 'Reassigned from Learning Orientation.', 47) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LRN-08', 'Agreeableness', 'People Skills', 'Coachability', 'Feedback usually annoys me more than helps me.', 'reverse', 'personality', 'Reverse. Reassigned from Learning Orientation.', 48) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LRN-11', 'Agreeableness', 'People Skills', 'Coachability', 'I''d rather hear honest feedback than be told I''m doing fine.', 'positive', 'personality', 'Reassigned from Learning Orientation.', 49) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LRN-12', 'Agreeableness', 'People Skills', 'Coachability', 'When someone corrects me, I''m glad they did.', 'positive', 'personality', 'Reassigned from Learning Orientation.', 50) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LRN-13', 'Agreeableness', 'People Skills', 'Coachability', 'When my manager points out a mistake, I focus on fixing it instead of defending myself.', 'positive', 'personality', 'Reassigned from Learning Orientation.', 51) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LOC-01', 'Self-Direction', 'Ownership', 'Internal Locus of Control', 'The kind of life I have is mostly the result of my own choices.', 'positive', 'personality', null, 52) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LOC-02', 'Self-Direction', 'Ownership', 'Internal Locus of Control', 'When something goes wrong, I look at what I could do differently.', 'positive', 'personality', null, 53) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LOC-03', 'Self-Direction', 'Ownership', 'Internal Locus of Control', 'If I work hard, things usually work out for me.', 'positive', 'personality', null, 54) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LOC-04', 'Self-Direction', 'Ownership', 'Internal Locus of Control', 'My success at work depends mostly on my own effort.', 'positive', 'personality', null, 55) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LOC-05', 'Self-Direction', 'Ownership', 'Internal Locus of Control', 'I can change my situation if I''m willing to put in the work.', 'positive', 'personality', null, 56) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LOC-06', 'Self-Direction', 'Ownership', 'Internal Locus of Control', 'Most of what happens to me is out of my control.', 'reverse', 'personality', 'Reverse. Watch DIF across demographics.', 57) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LOC-07', 'Self-Direction', 'Ownership', 'Internal Locus of Control', 'Whether I get ahead depends mostly on luck.', 'reverse', 'personality', 'Reverse.', 58) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LOC-08', 'Self-Direction', 'Ownership', 'Internal Locus of Control', 'Things would have gone better for me if I''d had more luck.', 'reverse', 'personality', 'Reverse.', 59) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LOC-09', 'Self-Direction', 'Ownership', 'Internal Locus of Control', 'When I don''t get what I want, it''s usually because of circumstances I couldn''t control.', 'reverse', 'personality', 'Reverse.', 60) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LOC-10', 'Self-Direction', 'Ownership', 'Internal Locus of Control', 'The way my day goes mostly depends on the people around me.', 'reverse', 'personality', 'Reverse.', 61) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'INI-01', 'Self-Direction', 'Ownership', 'Initiative & Ownership', 'When I see something that needs doing, I do it without waiting to be told.', 'positive', 'personality', null, 62) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'INI-02', 'Self-Direction', 'Ownership', 'Initiative & Ownership', 'If a customer or coworker has a problem, I look for a way to fix it.', 'positive', 'personality', null, 63) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'INI-03', 'Self-Direction', 'Ownership', 'Initiative & Ownership', 'When a mistake is mine, I say so and move to fix it.', 'positive', 'personality', 'Accountability/non-deflection.', 64) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'INI-04', 'Self-Direction', 'Ownership', 'Initiative & Ownership', 'I''d rather figure something out than wait for instructions.', 'positive', 'personality', null, 65) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'INI-05', 'Self-Direction', 'Ownership', 'Initiative & Ownership', 'If I see a better way to do something, I try it.', 'positive', 'personality', null, 66) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'INI-06', 'Self-Direction', 'Ownership', 'Initiative & Ownership', 'I do my job — anything beyond that is someone else''s problem.', 'reverse', 'personality', 'Reverse.', 67) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'INI-07', 'Self-Direction', 'Ownership', 'Initiative & Ownership', 'When something goes wrong, I usually wait for a manager to handle it.', 'reverse', 'personality', 'Reverse.', 68) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'INI-08', 'Self-Direction', 'Ownership', 'Initiative & Ownership', 'If a task wasn''t assigned to me, I don''t get involved.', 'reverse', 'personality', 'Reverse.', 69) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'INI-09', 'Self-Direction', 'Ownership', 'Initiative & Ownership', 'When something goes wrong on my shift, it''s usually not my fault.', 'reverse', 'personality', 'Reverse. Blame-deflection.', 70) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'INI-10', 'Self-Direction', 'Ownership', 'Initiative & Ownership', 'I prefer following clear orders to figuring things out on my own.', 'reverse', 'personality', 'Reverse.', 71) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'LRN-10', 'Self-Direction', 'Ownership', 'Initiative & Ownership', 'I''d rather be told exactly what to do than figure it out.', 'reverse', 'personality', 'Reverse. Reassigned from Learning Orientation.', 72) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'EMO-01', 'Emotional Stability', 'Composure', 'Composure', 'I stay calm when things get busy.', 'positive', 'personality', null, 73) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'EMO-02', 'Emotional Stability', 'Composure', 'Composure', 'I bounce back quickly after a bad shift.', 'positive', 'personality', null, 74) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'EMO-03', 'Emotional Stability', 'Composure', 'Composure', 'Pressure helps me focus.', 'positive', 'personality', 'May not load cleanly.', 75) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'EMO-04', 'Emotional Stability', 'Composure', 'Composure', 'When something goes wrong, I figure out the next step instead of getting stuck.', 'positive', 'personality', null, 76) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'EMO-05', 'Emotional Stability', 'Composure', 'Composure', 'I can let go of small problems and move on.', 'positive', 'personality', null, 77) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'EMO-06', 'Emotional Stability', 'Composure', 'Composure', 'I get rattled when several things happen at once.', 'reverse', 'personality', 'Reverse.', 78) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'EMO-07', 'Emotional Stability', 'Composure', 'Composure', 'A rude customer can ruin my whole day.', 'reverse', 'personality', 'Reverse.', 79) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'EMO-08', 'Emotional Stability', 'Composure', 'Composure', 'I take criticism harder than I''d like to.', 'reverse', 'personality', 'Reverse.', 80) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'EMO-09', 'Emotional Stability', 'Composure', 'Composure', 'When I make a mistake, I think about it for hours.', 'reverse', 'personality', 'Reverse.', 81) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;
insert into item_bank_items (version, item_id, category_academic, category_ui, facet, item_text, keying, item_kind, notes, sort_order) values ('v0.3', 'EMO-10', 'Emotional Stability', 'Composure', 'Composure', 'Stressful situations make it hard for me to think clearly.', 'reverse', 'personality', 'Reverse.', 82) on conflict (version, item_id) do update set item_text=excluded.item_text, facet=excluded.facet, keying=excluded.keying, sort_order=excluded.sort_order;

-- motivation screener (5 items; EEOC-safe — legal review required to modify)
insert into screener_items (version, item_id, question, format, options, scoring_note, sort_order) values ('v0.3', 'MOT-01', 'Which best describes why you''re looking for work right now?', 'single_select', '[{"value": 1, "label": "Saving for a specific goal (school, car, trip, etc.)"}, {"value": 2, "label": "Need steady income for ongoing expenses"}, {"value": 3, "label": "Want experience / building toward a career"}, {"value": 4, "label": "First job"}, {"value": 5, "label": "Looking for something to do / extra income"}, {"value": 6, "label": "Something else"}]'::jsonb, 'Categorical signal. Concrete-goal answers (1, 3) correlate with attendance/tenure. (2) is NEVER scored negatively — adverse-impact risk.', 0) on conflict (version, item_id) do update set question=excluded.question, options=excluded.options, scoring_note=excluded.scoring_note, sort_order=excluded.sort_order;
insert into screener_items (version, item_id, question, format, options, scoring_note, sort_order) values ('v0.3', 'MOT-02', 'If you''re working toward something specific, what is it?', 'free_text', null, 'Qualitative review only. Specific concrete answers = positive flag. Vague or blank = neutral. Do not score on content beyond specificity.', 1) on conflict (version, item_id) do update set question=excluded.question, options=excluded.options, scoring_note=excluded.scoring_note, sort_order=excluded.sort_order;
insert into screener_items (version, item_id, question, format, options, scoring_note, sort_order) values ('v0.3', 'MOT-03', 'If this job goes well, how long do you see yourself staying?', 'single_select', '[{"value": 1, "label": "Less than 6 months"}, {"value": 2, "label": "6 months to 1 year"}, {"value": 3, "label": "1\u20132 years"}, {"value": 4, "label": "2+ years"}, {"value": 5, "label": "Hoping to grow into a leadership role here"}]'::jsonb, 'Tenure expectation signal. Match against operator''s expected tenure. Self-report has modest validity (r ≈ .2 with actual tenure).', 2) on conflict (version, item_id) do update set question=excluded.question, options=excluded.options, scoring_note=excluded.scoring_note, sort_order=excluded.sort_order;
insert into screener_items (version, item_id, question, format, options, scoring_note, sort_order) values ('v0.3', 'MOT-04', 'In the past 6 months at any job or school, how many days have you missed without giving notice ahead of time?', 'single_select', '[{"value": 1, "label": "0"}, {"value": 2, "label": "1\u20132"}, {"value": 3, "label": "3\u20135"}, {"value": 4, "label": "6 or more"}, {"value": 5, "label": "Haven''t worked or been in school in the past 6 months"}]'::jsonb, 'BIODATA — highest validity item in screener. Past attendance is the strongest single predictor of future attendance (r ≈ .3–.4).', 3) on conflict (version, item_id) do update set question=excluded.question, options=excluded.options, scoring_note=excluded.scoring_note, sort_order=excluded.sort_order;
insert into screener_items (version, item_id, question, format, options, scoring_note, sort_order) values ('v0.3', 'MOT-05', 'What attracted you to this job specifically?', 'single_select', '[{"value": 1, "label": "Pay or hours fit what I need"}, {"value": 2, "label": "Location is convenient"}, {"value": 3, "label": "Someone I know recommended it"}, {"value": 4, "label": "I like this brand / restaurant"}, {"value": 5, "label": "Just need a job"}, {"value": 6, "label": "Other"}]'::jsonb, 'Job-fit signal. (3) and (4) correlate with retention. (5) flags lower commitment but is NOT a hard filter.', 4) on conflict (version, item_id) do update set question=excluded.question, options=excluded.options, scoring_note=excluded.scoring_note, sort_order=excluded.sort_order;

-- scoring + norming rules (Phase 2 reads this; pre-pilot placeholders)
insert into scoring_config (version, config) values ('v0.3', '{"version": "v0.3", "status": "pre_pilot", "item_scoring": {"scale": "1-5 Likert", "reverse_formula": "6 - raw", "note": "reverse-keyed items scored (6-raw); higher=more of construct"}, "facet_score": {"method": "mean of item scores within facet", "incomplete_if_skipped_pct_over": 20}, "category_score": {"method": "mean of facet scores (equal weights pre-pilot)", "post_pilot": "empirical regression weights"}, "bands": {"tier1_raw": {"high": ">=4.0", "mid": ">=3.0 and <4.0", "low": "<3.0", "active_when": "local incumbent N<15"}, "tier2_local": {"method": "tertiles within operator incumbent distribution", "active_when": "local incumbent N>=15", "refresh": "monthly or +10% sample"}, "tier3_crossop": {"method": "tertiles within full QDX incumbent population", "active_when": "QDX incumbents >=500", "display": "alongside tier2"}}, "overall_fit": {"strong_fit": "3+ category bands High, none Low, Ownership>=Mid", "consider": "2+ categories High, no more than 1 Low", "caution": "2+ Mid, exactly 1 Low", "not_recommended": "2+ categories Low", "ownership_priority_gate": true}, "attitude_composite": {"facets": ["Coachability", "Customer Warmth", "Team Cooperation"], "item_count": 30, "weight": "equal", "note": "~ Agreeableness category; reported as separate operator-facing label"}, "norm_refresh": {"cadence": "monthly or when new incumbents add >=10% to sample"}, "disclaimers": {"small_sample_n_under_20": "Based on [N] of your team members. Bands reflect your current crew, not industry norms. Limited data \u2014 borderline scores should be treated with care.", "local_active": "Benchmarked against [N] of your team members. Bands refresh as more team members complete the assessment."}, "measurement_error": {"sem_10item_facet": "~0.3-0.5 scale points", "borderline": "within +/-0.3 of a band boundary = ambiguous"}, "score_not_filter": true, "pre_pilot": "All weights, norms, cutoffs are placeholders until validation pilot (N>=300 incumbents w/ criterion data). Requires I/O psych sign-off before deployment as anything other than a research instrument."}'::jsonb) on conflict (version) do update set config=excluded.config;
