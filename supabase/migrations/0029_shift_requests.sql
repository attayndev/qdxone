-- ─────────────────────────────────────────────────────────────────────
-- Scheduler Phase 3: the shift marketplace. Employees request to PICK UP an
-- open shift or DROP one of their own; the manager approves. Approving a claim
-- assigns the shift; approving a drop opens it (employee_id → null) so someone
-- else can pick it up. (Targeted two-party swaps are a later phase.)
--
--   kind   — 'claim' (wants an open shift) | 'drop' (wants to give up their shift)
--   status — 'pending' | 'approved' | 'denied' | 'cancelled'
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists shift_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  shift_id uuid not null references shifts(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  kind text not null check (kind in ('claim', 'drop')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied', 'cancelled')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_shiftreq_org_status on shift_requests(org_id, status);
create index if not exists idx_shiftreq_shift on shift_requests(shift_id);
create index if not exists idx_shiftreq_employee on shift_requests(employee_id);

alter table shift_requests enable row level security;
drop policy if exists shift_requests_member_all on shift_requests;
create policy shift_requests_member_all on shift_requests
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
