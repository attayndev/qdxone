-- ─────────────────────────────────────────────────────────────────────
-- Remove the legacy demo org seed.
-- ─────────────────────────────────────────────────────────────────────
-- Migration 0002 seeded a demo "16 Handles New City" org (from the
-- pre-pivot single-tenant app) at a FIXED uuid. We've pivoted to inbound
-- self-serve signup, so that demo data shouldn't exist. Deleting by the
-- fixed seed uuid (NOT by slug) guarantees this can never affect a real
-- org an operator later signs up with — even one that picks the same slug.
--
-- Idempotent: no-op once the row is gone (cascades its child rows).
-- ─────────────────────────────────────────────────────────────────────
delete from organizations
where id = '00000000-0000-0000-0000-000000000001';
