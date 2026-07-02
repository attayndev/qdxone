-- 0020_org_suspension.sql
-- Platform-staff suspension of an org (super-admin). Kept separate from billing
-- `status` so unsuspending restores the real billing state. The proxy blocks a
-- suspended org's admin; null = not suspended.
alter table organizations add column if not exists suspended_at timestamptz;
