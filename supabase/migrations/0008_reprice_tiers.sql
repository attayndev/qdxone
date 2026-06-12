-- ─────────────────────────────────────────────────────────────────────
-- Reprice: drop Pro, fold Enterprise → Multi-unit (talk-to-us).
-- ─────────────────────────────────────────────────────────────────────
-- New lineup:
--   • Starter    — self-serve, 25 completed assessments/mo (then $3 each), 1 user
--   • Growth     — self-serve, 75 completed assessments/mo (then $2 each), 3 users
--   • Multi-unit — NOT self-serve (no Stripe Checkout); unlimited, set manually
--                  after a sales conversation. Replaces the old Pro+Enterprise.
--
-- The tiers are no longer feature-identical — Growth adds SMS/AI/analytics/
-- multi-location, Multi-unit adds the EEO dashboard, benchmarking, hierarchy,
-- and SSO. Those gates are enforced in the app, not the DB. The DB still only
-- tracks the volume quota of COMPLETED CANDIDATE assessments. NULL = unlimited.
--
-- Metered overage ($3 / $2 per extra completed assessment) is billed via
-- Stripe and wired in the Stripe pass — the DB doesn't meter it.
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

alter table organizations drop constraint if exists organizations_plan_check;
alter table organizations alter column plan drop default;

-- Fold the retired tiers into Multi-unit.
update organizations set plan = 'multi_unit' where plan in ('pro', 'enterprise');

alter table organizations alter column plan set default 'starter';
do $$ begin
  alter table organizations add constraint organizations_plan_check
    check (plan in ('starter', 'growth', 'multi_unit'));
exception when duplicate_object then null; end $$;

-- Growth included volume drops 100 → 75 (only touch rows still on the old default).
update organizations set monthly_assessment_quota = 75
  where plan = 'growth' and monthly_assessment_quota = 100;

-- Quota trigger: Starter 25 · Growth 75 · Multi-unit unlimited (null).
create or replace function set_assessment_quota_from_plan() returns trigger
language plpgsql as $$
begin
  if new.monthly_assessment_quota is null then
    new.monthly_assessment_quota := case new.plan
      when 'starter' then 25
      when 'growth'  then 75
      else null
    end;
  end if;
  return new;
end $$;
