# Scheduler — Phase 1 Spec (Schedule Builder, manager-facing)

**Status:** proposed (2026-07-26)
**Vision context:** first "management" module of the hire→onboard→manage platform
([[product_vision_hiring_and_management]]). Clones the core of When I Work's
scheduling, in phases. **Phase 1 is manager-only** — no employee login (deferred
to Phase 2); schedules are pushed to employees via SMS/email using contact info
we already hold. **Time clock/attendance is out of scope entirely.**

## Phase 1 goal
A manager builds a week's schedule on a grid, assigns employees to shifts (or
leaves them open), copies last week to start fast, and publishes — every
scheduled employee is notified of their shifts. Reuses employees, locations, roles.

## Data model (one migration)

### `shifts`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| org_id | uuid | fk organizations |
| location_id | uuid | fk locations (which store) |
| employee_id | uuid null | fk employees; **null = open shift** (placeholder gap; claiming is Phase 3) |
| role | text null | position worked (from org roles); defaults to the employee's current role |
| shift_date | date | the calendar day the shift starts |
| start_time | time | local to the store |
| end_time | time | local; if ≤ start_time the shift runs past midnight (overnight) |
| status | text | `draft` \| `published` (app-validated) |
| notes | text null | e.g. "opening / prep station" |
| published_at | timestamptz null | |
| created_by | uuid | member who built it |
| created_at, updated_at | timestamptz | |

- Times are **local to the store** (restaurants are single-timezone; avoids TZ
  infrastructure). Overnight = `end_time ≤ start_time`.
- **Double-booking guard:** the app rejects assigning an employee a shift that
  overlaps another of their shifts the same day.
- RLS member-all + service-role access (same pattern as employees/postings).

No `shift_templates` table in v1 — see Templates below.

## The week grid (UI)
New top-level **Schedule** nav item (like Employees).
- **Rows = employees** (+ an "Open shifts" row at top), **columns = the 7 days**
  of the selected week. Prev/next week navigation; defaults to the current week.
- A cell shows that employee's shift(s) that day (role · time). Click an empty
  cell to add a shift; click a shift to edit/delete.
- **Add/edit shift:** role (from org roles), start, end, notes, assigned employee
  (or "open"). Overlap with the same employee's day is blocked with a clear error.
- **Per-employee weekly hours total** in the row header (avoid over/under-
  scheduling). Location filter for multi-store orgs.
- Draft shifts render muted; published shifts solid. A **Publish** button
  publishes every draft shift in the visible week.

## Templates = "Copy previous week"
Phase 1's template mechanism is **Copy last week** (or copy any prior week):
duplicate that week's shifts into the current week, shifting the dates, as
**drafts** to edit before publishing. Covers the dominant real workflow. Named,
reusable templates are a fast-follow, not v1.

## Publish → notify
Publishing the week:
1. Flip the week's draft shifts to `published`, stamp `published_at`.
2. Notify each employee who has ≥1 published shift that week with their personal
   lineup ("Your schedule Aug 4–10: Mon 5:00–11:00pm · Wed 4:00–10:00pm …").
- **Channel: email by default** (every employee record has an email; no consent
  question). **SMS is opt-in** — reuse the existing SMS-consent model; only text
  employees who've consented. (Rationale: schedule texts to a personal phone are
  TCPA-sensitive; keep them consent-gated. Flagged as the one legal item.)
- Reuses the notification plumbing (operator-notify / Resend / Telnyx).
- Re-publishing after edits notifies only affected employees (changed/added).

## Explicitly OUT of Phase 1 (later phases)
- **Employee login / employee schedule view** — Phase 2 (magic-link/SMS web portal).
- **Availability & time-off requests** — Phase 2 (builder starts respecting them).
- **Open-shift claiming, swaps/drops** — Phase 3.
- **Time clock / attendance / timesheets** — out of scope (Yan).
- **Labor cost / forecasting, team messaging** — Phase 5.
- **Named reusable templates** — fast-follow after v1.

## Validated against the real WhenIWork (2026-07-26, Yan's live 16 Handles account)
Studied the actual product. The Phase 1 model above holds; refinements folded in:
- **Grid confirmed:** users × 7 days, an **OpenShifts row pinned at the top**,
  shift blocks show **time + a short role tag** ("3p–6p TEAM", "6p–11p MAN"),
  and an employee can have **multiple shifts in one day/cell**.
- **Shift quick-actions** (click a shift): **Edit · Delete · "Move to Open"**
  (convert an assigned shift into an open one) · **drag to move/reassign**.
  v1 = click-to-edit + delete + move-to-open; **drag-and-drop is polish** (fast-follow).
- **Publish is change-based:** the status pill reads "Everything Published / No
  changes" vs "N unpublished changes"; publishing pushes only the **changed**
  shifts and notifies only **affected** employees. So a shift needs a
  `published` state AND a notion of "modified since last publish."
- **Totals:** show **per-day assigned hours** across the bottom **and** a
  **week total** (WIW shows "237h"), plus per-employee weekly hours. All cheap.
- **View toggle** "by Week, as Users" — Phase 1 is Week × Users; **Day view** and
  **group-by-Positions** are easy follow-ons, not v1.
- **Add-shift entry points:** click an empty cell, a per-day column "+", or the
  OpenShifts row.
- **Confirmed-as-later layers** (leave out of Phase 1): availability hints
  (the green cell-corner markers), **TIME OFF / UNAVAILABLE** cells (Phase 2),
  per-employee **wages + labor-cost/sales forecast** sidebar (Phase 5), and
  **AI auto-scheduling** (the ✨ tool — much later).

## Build order (migration-first, verified on dev, one deploy)
1. Migration `0025_shifts.sql` (+ RLS/grants) → apply, reload PostgREST, regen types.
2. `src/lib/shifts.ts` — types, week queries, weekly-hours math, copy-week,
   overlap check (pure, unit-tested).
3. Server actions: create/update/delete shift, copy-week, publish (+ notify).
4. Schedule grid UI + Schedule nav item.
5. Demo seed: a published current-week schedule so the demo shows it populated.
6. Verify end-to-end on dev (build a week, copy, publish → notification fired),
   then deploy once.
