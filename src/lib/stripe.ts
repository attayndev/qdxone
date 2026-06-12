import Stripe from "stripe";

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
 * Stripe Price IDs per self-serve tier — flat monthly per-location base prices
 * (Starter $49 / Growth $99 — set the real amounts in Stripe). Each base plan
 * also has a metered overage price ($3/Starter, $2/Growth per completed
 * assessment past the included quota); those metered prices are added to the
 * Checkout subscription in the Stripe pass. Multi-unit is never self-serve.
 */
export const PRICE_IDS: Record<PaidPlan, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
};

export function priceForPlan(plan: PaidPlan): string {
  const id = PRICE_IDS[plan];
  if (!id) throw new Error(`Stripe price not configured: ${plan}`);
  return id;
}
