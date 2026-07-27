# Scheduler — Phase 2 Spec (Employee accounts, availability, time-off)

**Status:** proposed (2026-07-26)
**Goal:** Give employees their own login to see their schedule, block off times
they can't work, and request time off — and have the manager's builder respect
those. Decisions locked by Yan: **real employee accounts** (not bearer links);
**availability = block off unavailable times**.

## Access model — real accounts, email + password (à la Literal, no 2FA)
Mirrors the **`~/projects/literal`** dashboard-auth pattern (Yan: "same pattern
as Literal, less 2FA"). Employees become **Supabase Auth users** with an
**email + password** login — **not** magic-link, **no 2FA**. They're distinct
from operators (`org_members`), live in a separate **`/staff` area**, and see
**only their own** data — never admin.

- **`employees`** += `user_id` (uuid, nullable), `email` (denormalized from the
  application — the auth allowlist key), `invited_at`, `activated_at`. No invite
  tokens (Literal uses the email allowlist, not tokens).
- **The allowlist = the employees table.** An email may authenticate for an org
  only if it matches an `employees.email` in that org.
- **`/api/staff-auth`** route mirroring Literal's `dashboard-auth`, org-scoped:
  - `password` — `signInWithPassword(email, password)` → session cookie.
  - `reset` — if the email is an employee here, find-or-create the auth user
    (email_confirm) and email a **set-password** link. Always returns the same
    shape (never reveals membership).
  - `set-password` — `updateUser({ password })` for the current recovery session
    (the `/staff/set-password` page, reached from the emailed link).
- **Google SSO + Apple SSO** (also à la Literal's `/auth/google/route.ts`):
  server-initiated `signInWithOAuth` with the PKCE `code_verifier` stashed in a
  cookie (not localStorage), callback exchanges the code, **then the same roster
  allowlist gates access** — any Google/Apple user can authenticate, but only an
  email matching an `employees.email` in the org is let in (others get a "you're
  not on this team" bounce). Login page: "email + password, or continue with
  Google / Apple." Buttons are shown only when the provider is configured
  (a `ssoConfigured()` check, like `googleOAuthConfigured`).
- **Reuse existing plumbing:** web **Google SSO already works** in qdx
  (`LoginForm.tsx` `signInWithOAuth` → `/auth/callback`, PKCE cookie on
  `.qdx.one`, verified). `/staff/login` reuses that flow with `next=/staff`; the
  `/auth/callback` already honors a safe `next`, and the `/staff` `requireEmployee`
  gate does the roster check + `user_id` linking + non-employee bounce. So Google
  needs almost no new infra.
- **Infra prerequisites** (Yan / one-time, see [[sso_google_apple_backlog]]):
  Google is configured; **web Apple SSO still needs an Apple Services ID + key**
  in Supabase. Until Apple is configured, email+password + Google work and the
  Apple button stays hidden — so 2a ships without blocking on it.
- **`requireEmployee(orgId)`** (parallel to `requireMembership`): resolve the
  auth user → the `employees` row where `org_id = org.id AND email = auth email`;
  set `user_id`/`activated_at` on first hit. `/staff/*` requires it; `/admin/*`
  still requires `requireMembership`. A user is one or the other. All employee
  reads are **service-role AFTER `requireEmployee`, filtered to that employee's
  id**; RLS member-all stays the backstop.

### Onboarding / invite (manager → employee)
On an employee (must have an email), the manager clicks **Invite** → triggers the
`reset` action: creates+confirms the auth user if needed and emails a
**"Set your password to see your schedule at {Org}"** link. Stamp `invited_at`.
Employee clicks → `/staff/set-password` → sets password → signs in at
**`/staff/login`** (email + password) thereafter. `activated_at` set on first
sign-in. Employees can also self-serve "set / reset password" from the login page
(authorized because their email is on the roster). Re-invite / revoke from the
employee's admin page. (The set-password bootstrap link is a one-time
password-set link — standard for password auth, not a magic-link *login*.)

## 2FA scope (explicit)
- **Employees: no 2FA, ever.** Email+password or Google/Apple SSO only.
- **Operators (owner / manager / restaurant-owner `org_members`): 2FA as an
  OPTION** — opt-in TOTP (authenticator app), mirroring Literal's
  `dashboard/2fa/TwoFactorSetup` (Supabase MFA/`enroll`+`challenge`+`verify`).
  This is a **separate slice** hardening the *operator* login, tracked apart from
  the scheduler — it does NOT block Phase 2a. See [[sso_google_apple_backlog]].

## Employee portal (`/staff`)
- **My schedule** — their published shifts (this week + upcoming), week nav.
- **My availability** — a weekly grid where they **block off times they can't
  work** (recurring). See below.
- **Time off** — request a date range with a reason; see status (pending/approved/
  denied).
- Read-only of the org's published info only; no access to other employees.

## Availability = block-off (recurring weekly)
`employee_unavailability`: `(id, org_id, employee_id, day_of_week 0–6,
start_time, end_time, all_day bool, note)`. An employee adds blocks for when they
**can't** work (e.g., "Mon 9–3 — class"). Absence of a block = available.
Date-specific one-offs are handled by time-off (below), not here.

## Time-off requests + approvals
`time_off_requests`: `(id, org_id, employee_id, start_date, end_date, all_day,
start_time, end_time, reason, status 'pending'|'approved'|'denied', reviewed_by,
reviewed_at, review_note)`. Employee submits; manager approves/denies from a
queue. Approved time off shows on the builder and drives warnings.

## Manager side (in the existing builder)
- The grid shows **UNAVAILABLE** (from recurring blocks) and **TIME OFF** (from
  approved requests) markers in the relevant cells — like WhenIWork.
- A **time-off queue** (pending requests) to approve/deny; a badge count.
- **Soft warning** (not a hard block) when creating/editing a shift that lands on
  an employee's unavailability or approved time off — the manager can override.
- Employee admin page gains **Invite / re-invite / revoke portal access** and a
  view of their availability + time-off.

## Data model (one migration, 0026)
- `employees` += `user_id`, `invite_token_hash`, `invited_at`, `activated_at`.
- `employee_unavailability` (recurring blocks) — RLS member-all.
- `time_off_requests` — RLS member-all.
All employee-facing writes go through `requireEmployee`-gated server actions.

## Security checklist (must hold)
- `/staff` never renders admin data; every query is filtered to the caller's
  employee id.
- An employee of org A cannot read org B (org_id + user_id match required).
- Invite tokens hashed; magic-link is the auth (Supabase), token only maps the
  pending invite to the employee.
- Operators (org_members) and employees are separate; being one doesn't grant the
  other.

## Build order — three shippable slices
- **2a — Accounts + "My schedule".** `employees.user_id` + invite flow +
  `/staff/login` + `/staff` schedule view + `requireEmployee`. (The foundation.)
- **2b — Availability.** Employee block-off editor; builder shows UNAVAILABLE +
  soft warnings.
- **2c — Time-off + approvals.** Employee request flow; manager queue; builder
  shows TIME OFF + warnings.

Each slice: migration-first (2a only), verified on dev, deployed before the next.
