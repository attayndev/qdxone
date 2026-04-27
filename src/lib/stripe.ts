import Stripe from "stripe";

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  cached = new Stripe(key);
  return cached;
}

/**
 * Stripe Price IDs for each plan + cycle. Set these in your env after
 * creating the Products/Prices in your Stripe dashboard.
 *
 * The base prices are licensed (flat per period). The overage prices
 * are metered (usage-based).
 */
export const PRICE_IDS = {
  starter_annual: process.env.STRIPE_PRICE_STARTER_ANNUAL,
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  growth_annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL,
  growth_monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
  // Metered overage — annual/monthly cycles use different per-unit
  // amounts ($3 vs $4) so they need separate Stripe Prices.
  overage_questionnaire_annual:
    process.env.STRIPE_PRICE_OVERAGE_QUESTIONNAIRE_ANNUAL,
  overage_questionnaire_monthly:
    process.env.STRIPE_PRICE_OVERAGE_QUESTIONNAIRE_MONTHLY,
} as const;

export function priceForPlan(args: {
  plan: "starter" | "growth";
  cycle: "annual" | "monthly";
}): string {
  const key = `${args.plan}_${args.cycle}` as const;
  const id = PRICE_IDS[key];
  if (!id) throw new Error(`Stripe price not configured: ${key}`);
  return id;
}

export function overagePrice(cycle: "annual" | "monthly"): string {
  const id =
    cycle === "annual"
      ? PRICE_IDS.overage_questionnaire_annual
      : PRICE_IDS.overage_questionnaire_monthly;
  if (!id) throw new Error(`Overage price not configured for ${cycle}`);
  return id;
}
