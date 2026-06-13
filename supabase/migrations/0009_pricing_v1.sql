-- ─────────────────────────────────────────────────────────────────────
-- Pricing v1: Solo / Operator / Enterprise (location-count driven).
-- ─────────────────────────────────────────────────────────────────────
-- Supersedes the Starter/Growth/Multi-unit model (0004 + 0008). Tiers rename
-- starter→solo, growth→operator, multi_unit→enterprise.
--
-- v1 is location-count driven: Operator is volume-priced by location count, and
-- quota/seats/overage caps all scale per location. The authoritative limits now
-- live in code (src/lib/plan.ts) computed from (plan, location_count) — so the
-- old flat `monthly_assessment_quota` column + its plan-based trigger are dropped.
--
-- `location_count` is denormalized onto organizations (it drives pricing, quota,
-- seats, caps, and the Stripe subscription quantity) and kept in sync by a
-- trigger on the locations table — robust regardless of which code path mutates
-- locations.
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

-- 1. Rename plan values + check constraint.
alter table organizations drop constraint if exists organizations_plan_check;
alter table organizations alter column plan drop default;

update organizations set plan = case plan
  when 'starter'    then 'solo'
  when 'growth'     then 'operator'
  when 'multi_unit' then 'enterprise'
  else plan
end;

alter table organizations alter column plan set default 'solo';
do $$ begin
  alter table organizations add constraint organizations_plan_check
    check (plan in ('solo', 'operator', 'enterprise'));
exception when duplicate_object then null; end $$;

-- 2. Drop the flat quota column + trigger (limits are computed in code now).
drop trigger if exists organizations_set_quota on organizations;
drop function if exists set_assessment_quota_from_plan();
alter table organizations drop column if exists monthly_assessment_quota;

-- 3. Denormalized location_count, kept in sync by a trigger on locations.
alter table organizations
  add column if not exists location_count int not null default 0;

update organizations o set location_count = (
  select count(*) from locations l where l.org_id = o.id
);

create or replace function sync_org_location_count() returns trigger
language plpgsql as $$
declare
  target uuid := coalesce(new.org_id, old.org_id);
begin
  update organizations o
     set location_count = (select count(*) from locations l where l.org_id = target)
   where o.id = target;
  return coalesce(new, old);
end $$;

drop trigger if exists locations_sync_count on locations;
create trigger locations_sync_count
  after insert or delete on locations
  for each row execute function sync_org_location_count();
