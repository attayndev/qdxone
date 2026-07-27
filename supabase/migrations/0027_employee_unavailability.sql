-- ─────────────────────────────────────────────────────────────────────
-- Scheduler Phase 2b: recurring availability, expressed as BLOCK-OFF times —
-- an employee marks the times they CANNOT work (per weekday). Absence of a
-- block = available. Date-specific one-offs are time-off requests (Phase 2c),
-- not here.
--
--   day_of_week — 0=Sun … 6=Sat (matches JS getUTCDay)
--   all_day     — the whole weekday is blocked (start/end ignored)
--
-- Employees write their own via requireEmployee-gated actions; managers read
-- them in the builder. RLS member-all is the backstop.
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists employee_unavailability (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  all_day boolean not null default false,
  start_time time,
  end_time time,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_unavail_employee on employee_unavailability(employee_id);
create index if not exists idx_unavail_org on employee_unavailability(org_id);

alter table employee_unavailability enable row level security;
drop policy if exists employee_unavailability_member_all on employee_unavailability;
create policy employee_unavailability_member_all on employee_unavailability
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
