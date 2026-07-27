-- ─────────────────────────────────────────────────────────────────────
-- Scheduler Phase 2c: time-off requests. An employee requests a date range off
-- (all-day or partial), the manager approves or denies. Approved time off shows
-- in the builder and drives the same soft (non-blocking) conflict warning as
-- availability. Distinct from recurring block-off (employee_unavailability):
-- time-off is date-specific.
--
--   status — 'pending' | 'approved' | 'denied'
--   all_day — the whole day(s) off (start/end_time ignored)
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists time_off_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  all_day boolean not null default true,
  start_time time,
  end_time time,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_timeoff_org_status on time_off_requests(org_id, status);
create index if not exists idx_timeoff_employee on time_off_requests(employee_id);

alter table time_off_requests enable row level security;
drop policy if exists time_off_requests_member_all on time_off_requests;
create policy time_off_requests_member_all on time_off_requests
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
