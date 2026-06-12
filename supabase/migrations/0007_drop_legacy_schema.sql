-- ─────────────────────────────────────────────────────────────────────
-- Drop the pre-pivot single-tenant / invitation-era schema.
-- ─────────────────────────────────────────────────────────────────────
-- These tables, the legacy `admins` table + is_admin(), and the old enums
-- are unused after the pivot to the inbound intake platform. The new model
-- uses org_members + is_org_member, applications/assessment_* tables, and
-- text-based plan tiers. CASCADE drops dependent policies / FK constraints
-- (e.g. audit_events' invitation/applicant FKs — those columns remain).
--
-- Idempotent (IF EXISTS).
-- ─────────────────────────────────────────────────────────────────────

drop table if exists responses cascade;
drop table if exists admin_notes cascade;
drop table if exists applicants cascade;
drop table if exists invitations cascade;
drop table if exists usage_events cascade;
drop table if exists org_test_types cascade;
drop table if exists admins cascade;

drop function if exists is_admin() cascade;

drop type if exists invitation_status cascade;
drop type if exists hiring_status cascade;
drop type if exists recommendation cascade;
drop type if exists test_type_key cascade;
drop type if exists plan_tier cascade;
