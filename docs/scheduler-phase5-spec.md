# Scheduler — Phase 5 Spec (Labor cost projection)

**Status:** approved (2026-07-27)
**Goal:** Project **what the scheduled workers cost** — per day and per week — so
the manager sees the payroll impact of a schedule while building it. Just wages ×
hours. **Sales forecasts, labor %, and targets are OUT of scope** (Yan: the POS
already handles sales — not qdx's job). Phase 4 = time clock, skipped. No team
messaging.

## Privacy (non-negotiable)
Wages and labor cost are **manager-only**. They appear **only** in the admin
builder — **never** in the employee `/staff` area, and an employee never sees
anyone's pay (not even their own, in v1). All wage reads are behind
`requireMembership`.

## Data model (one migration, 0030)
- `employees` += **`hourly_wage numeric(8,2)`** (nullable — "no wage set").

## Labor cost math (pure, unit-tested)
- **Shift cost** = shiftHours × the assigned employee's hourly_wage. Open shifts
  and wage-less employees contribute 0 (and are flagged, not hidden).
- **Day / week labor cost** = sum of shift costs (scheduled hours already exist).
- **Straight hours × wage — no overtime multipliers** (state OT rules are their
  own project; show an honest straight-time number, don't fake OT).

## Builder UI
Extend the existing bottom totals area of the week grid: show **labor $ per day
and per week** next to the hours already there, plus a small "N employees need a
wage" nudge (links to fix). Set an employee's **hourly wage** on their admin page
(manager-only field). Wages/cost never appear in `/staff`.

## Explicitly OUT of Phase 5
- **Sales forecasts, labor %, budget targets** — the POS owns sales; out of scope.
- Overtime / double-time; salaried staff; multiple pay rates per person.
- Team messaging; time clock (Phase 4, skipped).
- Any wage visibility to employees.

## Build order (migration-first, verified on dev, one deploy)
1. Migration 0030 (`hourly_wage`) + types.
2. Pure labor-cost helpers (+ tests) in shifts-core.
3. Wage field on the employee admin page (manager-only) + setEmployeeWage action.
4. Builder: per-day/week labor $ + wage-missing nudge (page passes wageByEmployee).
5. Demo seed wages. Verify on dev, deploy.
