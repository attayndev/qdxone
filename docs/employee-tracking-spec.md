# Employee Tracking & Quarterly Reviews — Spec v1

**Status:** approved for build (2026-07-25)
**Goal:** Track every hire through their employment lifecycle — current role,
promotions, quarterly performance ratings, and termination — anchored to the
original application so performance can later be correlated against assessment
fit (the data foundation for refining the assessment).

## Core concept
An **Employee** is a hired candidate. Today a "hire" is an `applications` row
with `decision = 'hired'`, which also carries the candidate's fit score and
assessment. The employee record links back to that application, preserving the
line from *assessment fit → real-world performance*.

- Marking a candidate **hired** auto-creates an employee record (idempotent).
- Existing hires are **backfilled** so the roster isn't empty on launch.
- Roles come from the org's own list (`orgRoles(org.branding)`) — no fixed
  ladder. Starting role defaults to the position the candidate applied for.

## Data model (one migration)

### `employees`
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| org_id | uuid | fk organizations |
| location_id | uuid | fk locations (their store) |
| application_id | uuid null | fk applications → fit score + assessment. Null allows manual adds later. Unique when set (idempotent auto-create). |
| first_name, last_name | text | snapshot for display |
| current_role | text | from org's roles; defaults to applied position |
| employment_status | text | `employed` \| `terminated` (app-validated) |
| hired_at | date | from decision_at, else today |
| terminated_at | date null | |
| termination_reason | text null | |
| next_review_due | date | hired_at + 3 months; recomputed each review |
| created_at, updated_at | timestamptz | |

### `employee_reviews` — the quarterly check-in
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| employee_id | uuid | fk employees |
| org_id | uuid | |
| reviewed_at | timestamptz | |
| reviewed_by | uuid | member user id |
| role_at_review | text | role held when rated (honest history) |
| rating | int | 1–5 (see scale) |
| still_employed | bool | false → flips employee to terminated + reason |
| notes | text null | |

### `employee_role_changes` — promotion timeline
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| employee_id | uuid | fk employees |
| org_id | uuid | |
| from_role | text null | null for the initial role |
| to_role | text | |
| changed_at | timestamptz | |
| changed_by | uuid | member user id |

RLS/grants follow the existing per-org pattern; writes go through server actions
under `requireMembership`.

## Rating scale (stored as int 1–5, shown with label)
- **1 — Not meeting expectations**
- **2 — Below expectations**
- **3 — Meets expectations**
- **4 — Exceeds expectations**
- **5 — Outstanding**

## Review cadence + reminder
- **Monthly for the first 3 months of employment, then quarterly.** On hire and
  on each review, `next_review_due` = the from-date + 1 month while still inside
  the first 3 months of tenure (`hired_at + 3 months`), else + 3 months. Cleared
  when terminated.
- **In-app reminder (v1):** Employees section shows a "Reviews due" list + badge
  count = employees where `employment_status = 'employed'` and
  `next_review_due <= today`.
- **Email reminder (fast follow-on, not v1):** weekly org digest of due reviews,
  reusing the member-notification plumbing (same path as the "candidate hired"
  email).

## Navigation & screens
- New top-level **Employees** nav item (same treatment as Interviews).
- **List:** name · store · current role · status · last rating · next review
  (red "Due" badge when overdue). Filters: store, status, reviews-due.
- **Detail:** profile, promotion timeline, review history, link to original
  assessment. Actions:
  - **Add review** — role (prefilled current), 1–5 rating, still-employed?
    (no → terminate + reason), notes. Recomputes next_review_due.
  - **Change role / Promote** — pick from org roles; logs a role change.
  - **Mark terminated** — status + reason + date.

## Auto-create + backfill
- `setCandidateDecision(... 'hired')` upserts an employee (on `application_id`),
  default `current_role` = first applied position, `hired_at` = decision date,
  and writes the initial `employee_role_changes` row.
- Migration backfills employees for all existing `decision = 'hired'` applications.

## Explicitly OUT of v1 (next epic)
- The **fit-vs-performance analytics dashboard** (avg rating by fit band, etc.).
  This spec builds the tracking foundation that unlocks it.
- Org-editable rating labels; role-order-aware "promotion vs lateral" labeling.

## Build order (migration-first, verified locally before prod)
1. Migration `0023_employees.sql` (tables + RLS + grants) — apply, reload PostgREST schema.
2. `src/lib/employees.ts` (types, queries, next-review math, backfill helper).
3. Server actions (create-on-hire hook, add review, change role, terminate).
4. Backfill existing hires.
5. Employees list + detail UI; nav item.
6. Verify end-to-end on the dev server (real session) before deploying once.
