import Stripe from "stripe";
import type { BillingCycle } from "./supabase/types";

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  cached = new Stripe(key);
  return cached;
}

// The two self-serve tiers. Multi-unit is talk-to-us (no Checkout price).
export type PaidPlan = "starter" | "growth";

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
 * Stripe Price IDs per self-serve tier. Each plan has a monthly + annual flat
 * base price plus a metered overage price ($3/Starter, $2/Growth per completed
 * assessment past quota) in BOTH intervals — Stripe requires every recurring
 * price on a subscription to share one billing interval, so the overage must
 * match the base's cycle. A Checkout subscription = base(cycle) + overage(cycle).
 * Multi-unit is never self-serve.
 */
export const PLAN_PRICES: Record<PaidPlan, PlanPrices> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL,
    overageMonthly: process.env.STRIPE_PRICE_STARTER_OVERAGE_MONTHLY,
    overageAnnual: process.env.STRIPE_PRICE_STARTER_OVERAGE_ANNUAL,
  },
  growth: {
    monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
    annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL,
    overageMonthly: process.env.STRIPE_PRICE_GROWTH_OVERAGE_MONTHLY,
    overageAnnual: process.env.STRIPE_PRICE_GROWTH_OVERAGE_ANNUAL,
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
