import Stripe from "stripe";

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  cached = new Stripe(key);
  return cached;
}

export type PaidPlan = "starter" | "growth" | "pro";

/**
 * Stripe Price IDs per tier. All three are flat monthly per-location prices
 * (Starter $49 / Growth $99 / Pro $249 — set the real amounts in Stripe).
 * No metered/overage prices: the model is upgrade-the-tier, not overage.
 * Enterprise is never self-serve, so it has no price here.
 */
export const PRICE_IDS: Record<PaidPlan, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
  pro: process.env.STRIPE_PRICE_PRO,
};

export function priceForPlan(plan: PaidPlan): string {
  const id = PRICE_IDS[plan];
  if (!id) throw new Error(`Stripe price not configured: ${plan}`);
  return id;
}
