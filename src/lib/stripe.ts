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

type PlanPrices = {
  monthly?: string; // flat base price, billed monthly ($59 / $79 per location)
  annual?: string; //  flat base price, billed yearly  (2 months free)
};

/**
 * Stripe Price IDs per self-serve tier — a flat per-location base price, monthly
 * and annual. Assessments are unlimited (no metered/overage prices, no meter).
 * Solo bills quantity 1; Operator bills quantity = location count. A Checkout
 * subscription is just the one base price. Enterprise is never self-serve.
 */
export const PLAN_PRICES: Record<PaidPlan, PlanPrices> = {
  solo: {
    monthly: process.env.STRIPE_PRICE_SOLO_MONTHLY,
    annual: process.env.STRIPE_PRICE_SOLO_ANNUAL,
  },
  operator: {
    monthly: process.env.STRIPE_PRICE_OPERATOR_MONTHLY,
    annual: process.env.STRIPE_PRICE_OPERATOR_ANNUAL,
  },
};

/** Flat base price for the plan + billing cycle. Throws if not configured. */
export function basePriceFor(plan: PaidPlan, cycle: BillingCycle): string {
  const id = cycle === "annual" ? PLAN_PRICES[plan].annual : PLAN_PRICES[plan].monthly;
  if (!id) throw new Error(`Stripe base price not configured: ${plan}/${cycle}`);
  return id;
}

const ALL_PRICES = Object.values(PLAN_PRICES);

/** Is this price id one of the base prices (any plan/cycle)? */
export function isBasePrice(priceId: string): boolean {
  return ALL_PRICES.some((p) => p.monthly === priceId || p.annual === priceId);
}
