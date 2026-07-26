-- ─────────────────────────────────────────────────────────────────────
-- Scheduler Phase 1: shifts. Manager-built weekly schedules assigning
-- employees (or leaving shifts open) to time slots at a location. Tenant-
-- scoped by org_id; same service-role-after-requireMembership access pattern
-- as employees/postings, with RLS member-all as the backstop.
--
--   employee_id null            → an OPEN shift (a gap; claiming is a later phase)
--   status draft | published    → published shifts are the notified/committed ones
--   "unpublished changes"        → derived in app: status='draft' OR updated_at > published_at
--   times are LOCAL to the store; end_time <= start_time means the shift runs
--     past midnight (overnight). Same-employee overlap is rejected in the app.
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  employee_id uuid references employees(id) on delete set null, -- null = open shift
  role text,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  notes text,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_shifts_org_week on shifts(org_id, shift_date);
create index if not exists idx_shifts_employee on shifts(employee_id);
create index if not exists idx_shifts_location on shifts(location_id);

drop trigger if exists shifts_set_updated_at on shifts;
create trigger shifts_set_updated_at before update on shifts
  for each row execute function set_updated_at();

alter table shifts enable row level security;
drop policy if exists shifts_member_all on shifts;
create policy shifts_member_all on shifts
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
