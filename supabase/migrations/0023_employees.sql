-- ─────────────────────────────────────────────────────────────────────
-- Employee tracking & quarterly reviews (native module). Tenant-scoped by
-- org_id. An "employee" is a hired candidate: created when an application is
-- marked decision='hired', linked back to that application so performance
-- (reviews) can later be correlated against assessment fit.
--
-- Roles are NOT a fixed ladder — current_role/role_at_review are free text
-- validated in the app against the org's own role list (branding.roles).
--
-- All app access is via the service-role client (adminClient(), bypasses RLS)
-- AFTER an app-level requireMembership() check — same pattern as
-- locations/job_postings/applications. RLS is the backstop that denies the
-- anon/authenticated keys (shipped to the browser) any direct access.
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

-- One per hired person. application_id is nullable (allows manual adds later)
-- and unique-when-set so create-on-hire is idempotent.
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  location_id uuid references locations(id) on delete set null,
  application_id uuid references applications(id) on delete set null,
  first_name text not null,
  last_name text not null,
  current_role_name text,  -- `current_role` is a reserved SQL keyword
  employment_status text not null default 'employed'
    check (employment_status in ('employed', 'terminated')),
  hired_at date not null default current_date,
  terminated_at date,
  termination_reason text,
  next_review_due date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_employees_org on employees(org_id);
create index if not exists idx_employees_review_due
  on employees(org_id, next_review_due) where employment_status = 'employed';
-- Idempotent create-on-hire: at most one employee per source application.
create unique index if not exists uq_employees_application
  on employees(application_id) where application_id is not null;

drop trigger if exists employees_set_updated_at on employees;
create trigger employees_set_updated_at before update on employees
  for each row execute function set_updated_at();

-- The quarterly check-in. rating 1..5 (1 = not meeting, 5 = outstanding).
create table if not exists employee_reviews (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  reviewed_at timestamptz not null default now(),
  reviewed_by uuid,
  role_at_review text,
  rating int check (rating between 1 and 5),
  still_employed boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_empreviews_employee
  on employee_reviews(employee_id, reviewed_at desc);
create index if not exists idx_empreviews_org on employee_reviews(org_id);

-- Promotion / role-change timeline. from_role null = the initial role.
create table if not exists employee_role_changes (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  from_role text,
  to_role text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_emprolechg_employee
  on employee_role_changes(employee_id, changed_at desc);
create index if not exists idx_emprolechg_org on employee_role_changes(org_id);

-- ── Row Level Security: member-all, mirroring the existing org-scoped tables.
alter table employees            enable row level security;
alter table employee_reviews     enable row level security;
alter table employee_role_changes enable row level security;

drop policy if exists employees_member_all on employees;
create policy employees_member_all on employees
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

drop policy if exists employee_reviews_member_all on employee_reviews;
create policy employee_reviews_member_all on employee_reviews
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

drop policy if exists employee_role_changes_member_all on employee_role_changes;
create policy employee_role_changes_member_all on employee_role_changes
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
