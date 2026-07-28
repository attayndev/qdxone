-- ─────────────────────────────────────────────────────────────────────
-- Scheduler Phase 5: labor-cost projection. Each employee gets an hourly wage;
-- the builder projects what a schedule costs (straight hours × wage). Wages are
-- MANAGER-ONLY — never surfaced in the /staff employee area.
-- Nullable = "no wage set" (the builder flags these, doesn't guess).
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

alter table employees
  add column if not exists hourly_wage numeric(8, 2);
