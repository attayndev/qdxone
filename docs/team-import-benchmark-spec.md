# Import Existing Team + Benchmark Everyone — Spec

**Status:** proposed (2026-07-27)
**Goal:** Let an operator bring their **pre-qdx team** into the platform (CSV
upload of name/email/phone) and **assess everyone** — so the fit-vs-performance
analytics cover the whole roster, not just people who applied through qdx. This
is what makes "does the assessment predict performance?" credible: benchmark the
existing staff, not a self-selected sample.

## Two parts
**A — CSV import of existing employees.** Upload a spreadsheet → create employee
records for people already working there.
**B — Assessment gap scan + send.** Find employees who haven't been assessed and
send them the assessment, so the whole team is benchmarked.

## The key reuse: a "shadow application"
The assessment + all analytics run off `applications`. So each imported/existing
employee gets a **shadow application** (their name/email/phone, `positions =
[current role]`, no job posting) with `employee.application_id` pointed at it.
Then **everything already built just works**: `sendAssessmentToCandidate`-style
send, `/a/[token]` assessment, `fitByApplication`, and the per-fit /
per-dimension analytics — no new assessment pipeline.
- Shadow apps are flagged (e.g. `applications.source = 'roster_import'`) so they
  don't pollute the hiring funnel/reports (candidate lists filter them out).

## A — CSV import
- **On the Employees page:** "Import existing team (CSV)" next to "Import past hires".
- **Columns:** `first_name`, `last_name`, `email`, `phone`, optional `role`.
  Header row auto-mapped (case/spacing-insensitive); a single `name` column is
  split. **Required: a name + email** (email is how we send the assessment).
- **Flow:** upload → **preview table** (rows, mapped columns, per-row
  validation + "will skip: already on roster / bad email") → confirm → create.
- **Per row:** create employee (`employment_status='employed'`, role from CSV or
  a default) + a shadow application; link them. Dedup by email within the org
  (skip existing). Phone optional.
- Parsing is pure + unit-tested (header mapping, name split, validation, dedup).

## B — Assessment gap scan + send
- **"Not assessed" = employee whose shadow/linked application has no COMPLETE
  assessment session.** (Applied-through-qdx hires who already completed it are
  not flagged.)
- **Employees page banner:** "N of your team haven't been assessed — send the
  assessment" → bulk send, or per-employee "Send assessment" on the detail page.
- **Send:** reuse `createCandidateAssessment` on their application + email the
  link (SMS optional, consent-gated — email default). Employee-facing copy framed
  as a **team skills benchmark**, not "apply for a job" (small copy variant; same
  assessment items).
- On completion → their fit computes → they appear in the analytics automatically.

## Explicitly OUT of v1
- SMS-first sending (email default; SMS behind existing consent).
- Bulk re-assessment / re-benchmark cadence.
- Editing a shadow application in the hiring UI (it's roster-only).
- Wages/other columns in the CSV (name/email/phone/role only for v1).

## Build order (verified on dev, deploy per slice)
1. **A:** Migration 0031 (`applications.source` flag) + types; pure CSV parser
   (+tests); Employees "Import team (CSV)" upload → preview → create (employees +
   shadow apps); candidate lists/reports exclude `source='roster_import'` until
   assessed. Verify, deploy.
2. **B:** gap scan (banner + per-employee) + send-assessment action (reusing the
   candidate assessment) with the benchmark copy variant; verify (import → send →
   complete → shows in analytics), deploy.

## Still queued (unrelated): scheduler drag-and-drop
Not part of this feature — see [[scheduler_backlog_odds_ends]]; will build when
we return to the scheduler.
