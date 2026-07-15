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
  monthly?: string; // base price, billed monthly
  annual?: string; //  base price, billed yearly (2 months free)
};

/**
 * Stripe Price IDs per self-serve tier. Assessments are unlimited (no
 * metered/overage prices, no meter). Solo: flat $59, quantity 1. Operator:
 * a GRADUATED-TIER price — first unit (location) $79, every additional unit
 * $50 — billed with quantity = location count, so the existing quantity-sync
 * logic needs no change. Annual mirrors it at 10× (2 months free).
 * TODO(stripe-phase): create the graduated Operator prices in Stripe and
 * point STRIPE_PRICE_OPERATOR_{MONTHLY,ANNUAL} at them (tiers: up_to 1 →
 * $79/$790, inf → $50/$500). Until then Stripe still bills the old flat
 * $79/location. Enterprise is never self-serve.
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
