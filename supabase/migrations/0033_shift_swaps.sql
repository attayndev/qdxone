-- ─────────────────────────────────────────────────────────────────────
-- Scheduler: targeted two-party shift swaps. Employee A proposes trading their
-- shift (from_shift) for coworker B's shift (to_shift). B accepts, then the
-- manager approves — at which point the two shifts change hands.
--
--   status: proposed  — A proposed, waiting on B
--           accepted  — B accepted, waiting on the manager
--           approved  — manager approved (shifts traded)
--           declined  — B declined or manager denied
--           cancelled — A withdrew
--
-- Distinct from shift_requests (claim/drop). Idempotent.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists shift_swaps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  from_employee_id uuid not null references employees(id) on delete cascade,
  from_shift_id uuid not null references shifts(id) on delete cascade,
  to_employee_id uuid not null references employees(id) on delete cascade,
  to_shift_id uuid not null references shifts(id) on delete cascade,
  status text not null default 'proposed'
    check (status in ('proposed', 'accepted', 'approved', 'declined', 'cancelled')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_swaps_org_status on shift_swaps(org_id, status);
create index if not exists idx_swaps_from on shift_swaps(from_employee_id);
create index if not exists idx_swaps_to on shift_swaps(to_employee_id);

alter table shift_swaps enable row level security;
drop policy if exists shift_swaps_member_all on shift_swaps;
create policy shift_swaps_member_all on shift_swaps
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
