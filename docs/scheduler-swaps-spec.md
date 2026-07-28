# Scheduler — Targeted Two-Party Shift Swaps

**Status:** proposed (2026-07-28)
**Goal:** Let an employee trade a specific shift with a specific coworker — "I'll
take your Friday if you take my Saturday." The Phase 3 marketplace already covers
drop→open→claim (give up a shift, anyone grabs it); this adds the **directed,
two-way trade** it doesn't. Both employees must agree, then the manager approves.

## Flow (three gates)
1. **Propose** — Employee A, on one of their shifts, picks a coworker B and one of
   B's upcoming shifts to trade for → a swap is `proposed`.
2. **Peer accept** — B sees "A wants to trade their {X} for your {Y}" → Accept /
   Decline. Accept → `accepted` (awaiting manager).
3. **Manager approve** — the swap shows in the Requests queue → Approve / Deny.
   Approve → the two shifts change hands (X→B, Y→A).

A can cancel while `proposed`/`accepted`. Manager deny or B decline → `declined`.

## Scope decisions (recommended)
- **Two-way trade only** (both sides give a shift). A pure "cover me" (give a
  shift, get nothing) is already the Phase 3 drop→claim — no need to duplicate it.
- **Manager approval required** (consistent with time-off / claim / drop). No
  auto-apply on peer-accept.
- **Eligible shifts:** each side's **published, upcoming** shifts at the same
  location. On approve, a hard **overlap check** on both people (block if the
  trade would double-book someone); soft availability/time-off warning otherwise.

## Data model (migration 0033)
`shift_swaps`:
| column | notes |
|---|---|
| id, org_id | |
| from_employee_id, from_shift_id | proposer + their shift (X) |
| to_employee_id, to_shift_id | target coworker + their shift (Y) |
| status | `proposed` \| `accepted` \| `approved` \| `declined` \| `cancelled` |
| reviewed_by, reviewed_at | manager |
| created_at | |
RLS member-all; cascades with the org. (Shifts referenced by id; guard against a
shift that moved/was deleted before approval.)

## Employee side (/staff)
- **My Schedule:** each shift gains a **Swap** action → pick coworker → pick which
  of their shifts to trade → propose. Shows "Swap proposed" until resolved.
- **Swaps section:** *incoming* (someone wants to trade with me → Accept/Decline)
  and *outgoing* (mine, with status). Cancel while pending.

## Manager side
- The unified **/admin/schedule/requests** queue gains a **Shift swaps** section
  (accepted, awaiting approval): "A ⇄ B — {X} for {Y}" → Approve / Deny. The
  "Requests (N)" badge count includes accepted swaps.
- On approve: reassign both shifts (overlap-checked, soft conflict warning),
  stamp reviewed_by/at.

## Explicitly OUT of v1
- Three-way / open-ended trades; partial-shift swaps.
- Auto-notify beyond in-app (email/SMS a later pass).
- Swapping across locations.

## Build order (migration-first, verified on dev, one deploy)
1. Migration 0033 `shift_swaps` + types.
2. `src/lib/shift-swaps.ts` (fetch: swappable coworker shifts, incoming/outgoing
   for an employee, accepted queue for manager; pure guards).
3. Employee actions (proposeSwap / respondSwap accept·decline / cancelSwap) +
   /staff Swap UI (propose flow + swaps section).
4. Manager approve/deny action; Requests-queue swaps section; badge includes swaps.
5. Demo seed a proposed + an accepted swap. Verify on dev (propose→accept→
   approve→shifts trade hands), deploy.
