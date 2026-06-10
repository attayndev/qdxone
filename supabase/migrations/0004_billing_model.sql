-- ─────────────────────────────────────────────────────────────────────
-- Phase 1: billing model
-- ─────────────────────────────────────────────────────────────────────
-- Reprices to Starter / Growth / Pro / Enterprise and splits the two
-- concepts the old schema conflated:
--   • plan   = tier (capability/volume)  → text + check
--   • status = lifecycle                 → trialing | active | past_due | canceled
--
-- The three SMB tiers are feature-identical; they differ only on the
-- monthly quota of COMPLETED CANDIDATE assessments:
--   Starter 25 · Growth 100 · Pro unlimited (null) · Enterprise unlimited (null)
-- Enterprise is never self-serve (no Stripe Checkout); set manually.
--
-- `plan` is text+check (not an enum) on purpose — Postgres can't use a
-- newly-added enum value in the same transaction, which makes enum
-- repricing painful. Text+check sidesteps that entirely.
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

-- 1. plan: plan_tier enum → text + check (starter|growth|pro|enterprise)
alter table organizations alter column plan drop default;
alter table organizations
  alter column plan type text using (
    case plan::text
      when 'trial'    then 'starter'   -- trial was a status, not a plan
      when 'starter'  then 'starter'
      when 'growth'   then 'growth'
      when 'canceled' then 'starter'   -- canceled is a status, not a plan
      else 'starter'
    end
  );
alter table organizations alter column plan set default 'starter';
do $$ begin
  alter table organizations add constraint organizations_plan_check
    check (plan in ('starter','growth','pro','enterprise'));
exception when duplicate_object then null; end $$;

-- 2. status: lifecycle text + check
alter table organizations alter column status set default 'trialing';
update organizations set status = 'active'
  where status not in ('trialing','active','past_due','canceled');
do $$ begin
  alter table organizations add constraint organizations_status_check
    check (status in ('trialing','active','past_due','canceled'));
exception when duplicate_object then null; end $$;

-- 3. monthly quota of completed candidate assessments. NULL = unlimited.
alter table organizations
  add column if not exists monthly_assessment_quota int;

-- Backfill existing rows from their plan.
update organizations set monthly_assessment_quota =
  case plan
    when 'starter' then 25
    when 'growth'  then 100
    else null            -- pro / enterprise = unlimited
  end
where monthly_assessment_quota is null;

-- Keep the quota in sync with the plan on insert (so signup / provisioning
-- don't have to know the numbers). Plan UPGRADES update the quota in the
-- billing webhook, and Enterprise custom quotas set explicitly are
-- preserved (the trigger only fills a NULL).
create or replace function set_assessment_quota_from_plan() returns trigger
language plpgsql as $$
begin
  if new.monthly_assessment_quota is null then
    new.monthly_assessment_quota := case new.plan
      when 'starter' then 25
      when 'growth'  then 100
      else null
    end;
  end if;
  return new;
end $$;

drop trigger if exists organizations_set_quota on organizations;
create trigger organizations_set_quota
  before insert on organizations
  for each row execute function set_assessment_quota_from_plan();

-- Note: the billable unit is a COMPLETED candidate assessment, counted from
-- assessment_sessions (status='complete', subject_type='candidate',
-- completed_at within the current month). Incumbent-benchmark completions do
-- NOT count. The legacy org_test_types / usage_events tables are unused by
-- the new metering and will be dropped once the new flow is verified.
