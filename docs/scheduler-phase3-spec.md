# Scheduler — Phase 3 Spec (Shift marketplace: claim + drop)

**Status:** proposed (2026-07-27)
**Goal:** Let employees pick up open shifts and give up shifts they can't work,
with the manager in control. Together, claim + drop form a **shift marketplace**:
someone drops a shift → it becomes open → someone else picks it up — which covers
most of the "swap" need without two-party coordination.

## Model decision — approval-required (recommended)
Every pickup/drop is a **request the manager approves** (mirrors time-off), so the
manager keeps control and conflicts are caught. (Instant self-serve pickup is a
later per-org toggle; not v1.)

- **Claim:** employee taps **Pick up** on an open published shift → a pending
  `claim` request. On approve, the shift is assigned to them (if still open and
  no overlap); other pending claims for that shift are auto-declined.
- **Drop:** employee taps **Drop** on one of their shifts → a pending `drop`
  request. On approve, the shift becomes **open** (employee_id → null) — where
  someone else can claim it.

## Data model (one migration, 0029)
`shift_requests`:
| column | notes |
|---|---|
| id, org_id | |
| shift_id | fk shifts (on delete cascade) |
| employee_id | requester (claimer, or the current holder dropping) |
| kind | `claim` \| `drop` |
| status | `pending` \| `approved` \| `denied` \| `cancelled` |
| reviewed_by, reviewed_at, review_note | |
| created_at | |
RLS member-all; cascades with the shift.

## Employee side (/staff)
- **My Schedule:** each of their published shifts gets a **Drop** action (creates
  a drop request; shows "Drop pending" until decided).
- **Open shifts:** a section listing published, unassigned shifts at their
  location with **Pick up** (creates a claim request; shows "Requested").
- Their pending requests are cancellable while pending.

## Manager side — one unified Requests queue
Fold approvals into a single **/admin/schedule/requests** page covering **time-off
AND shift claim/drop** (rename the current time-off queue). One **"Requests (N)"**
badge in the schedule header counts all pending items.
- **Claim** row: "{name} wants to pick up {day, time, role}" → Approve / Deny.
  Approve assigns; a soft note if it conflicts with their availability/time-off or
  an existing shift (reuse conflict checks; block only a hard overlap).
- **Drop** row: "{name} wants to drop {day, time}" → Approve (→ open) / Deny.

## Builder reflection
- A dropped-then-open shift shows in the Open Shifts row (already rendered).
- Optional light touch: a small "claim pending" hint on shifts with open requests
  (nice-to-have, not required for v1).

## Explicitly OUT of v1
- **Targeted two-party swaps** (trade a specific shift with a specific coworker,
  both must accept) — deferred; drop→open→claim covers most of it.
- **Instant self-serve pickup** (no approval) — later per-org toggle.
- Push/SMS "new open shift" broadcasts — email-light only if at all in v1.

## Build order (migration-first, verified on dev, one deploy)
1. Migration 0029 `shift_requests` + types.
2. `src/lib/shift-requests.ts` (fetch: employee's requests, open shifts for an
   employee, pending queue with labels; pure bits if any).
3. Employee actions (claimShift, dropShift, cancelRequest) + /staff Open-shifts
   list + Drop on My Schedule.
4. Manager: approve/deny actions; unify the Requests queue (time-off + shift);
   header badge counts both.
5. Demo seed a claim + a drop request.
6. Verify on dev (pick up → approve → assigned; drop → approve → open), deploy.
