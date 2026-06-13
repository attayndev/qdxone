import Stripe from "stripe";
import type { BillingCycle } from "./supabase/types";
import type { PaidPlan } from "./plan";

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  cached = new Stripe(key);
  return cached;
}

export type { PaidPlan };

/**
 * The `event_name` configured on the Stripe Billing Meter that the overage
 * prices aggregate. We emit one event (value 1) per completed candidate
 * assessment that lands PAST the plan's included monthly quota. The meter must
 * use Stripe's default payload keys: `stripe_customer_id` + `value`.
 */
export const ASSESSMENT_METER_EVENT = "assessment_completed";

type PlanPrices = {
  monthly?: string; //        flat base price, billed monthly ($49 / $99)
  annual?: string; //         flat base price, billed yearly  (2 months free)
  overageMonthly?: string; // metered overage, monthly-interval
  overageAnnual?: string; //  metered overage, annual-interval
};

/**
 * Stripe Price IDs per self-serve tier. Each plan has a monthly + annual base
 * price plus a metered overage price in BOTH intervals — Stripe requires every
 * recurring price on a subscription to share one billing interval, so the
 * overage must match the base's cycle. A Checkout subscription =
 * base(cycle) + overage(cycle).
 *
 * Solo's base is flat ($49, quantity 1). Operator's base is a VOLUME-tiered
 * price ($99/$79/$59/$49 bands) with quantity = location count. Enterprise is
 * never self-serve, so it has no price here.
 */
export const PLAN_PRICES: Record<PaidPlan, PlanPrices> = {
  solo: {
    monthly: process.env.STRIPE_PRICE_SOLO_MONTHLY,
    annual: process.env.STRIPE_PRICE_SOLO_ANNUAL,
    overageMonthly: process.env.STRIPE_PRICE_SOLO_OVERAGE_MONTHLY,
    overageAnnual: process.env.STRIPE_PRICE_SOLO_OVERAGE_ANNUAL,
  },
  operator: {
    monthly: process.env.STRIPE_PRICE_OPERATOR_MONTHLY,
    annual: process.env.STRIPE_PRICE_OPERATOR_ANNUAL,
    overageMonthly: process.env.STRIPE_PRICE_OPERATOR_OVERAGE_MONTHLY,
    overageAnnual: process.env.STRIPE_PRICE_OPERATOR_OVERAGE_ANNUAL,
  },
};

/** Flat base price for the plan + billing cycle. Throws if not configured. */
export function basePriceFor(plan: PaidPlan, cycle: BillingCycle): string {
  const id = cycle === "annual" ? PLAN_PRICES[plan].annual : PLAN_PRICES[plan].monthly;
  if (!id) throw new Error(`Stripe base price not configured: ${plan}/${cycle}`);
  return id;
}

/** Interval-matched metered overage price for the plan, or null if unset. */
export function overagePriceFor(plan: PaidPlan, cycle: BillingCycle): string | null {
  const p = PLAN_PRICES[plan];
  return (cycle === "annual" ? p.overageAnnual : p.overageMonthly) ?? null;
}

const ALL_PRICES = Object.values(PLAN_PRICES);

/** Is this price id one of the flat base prices (any plan/cycle)? */
export function isBasePrice(priceId: string): boolean {
  return ALL_PRICES.some((p) => p.monthly === priceId || p.annual === priceId);
}

/** Is this price id one of the metered overage prices (any plan/cycle)? */
export function isOveragePrice(priceId: string): boolean {
  return ALL_PRICES.some(
    (p) => p.overageMonthly === priceId || p.overageAnnual === priceId
  );
}
