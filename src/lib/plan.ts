// ─────────────────────────────────────────────────────────────────────
// Pricing — the single source of truth for tiers, prices, and features.
// ─────────────────────────────────────────────────────────────────────
// Tier is driven by LOCATION COUNT for self-serve; Enterprise is a manual flag.
// Pricing is a flat per-location subscription — UNLIMITED assessments on every
// tier (no caps, no metered overage). The Operator premium ($20/location over
// Solo) buys features, not volume: unified login across stores, SMS, AI, and
// extra testing modules. Compute "what can this org do / what does it cost"
// from here — don't hardcode tier numbers elsewhere.
//
// Canonical pricing doc: docs/pricing-strategy-v1.md.

import type { PlanTier, BillingCycle } from "./supabase/types";

export type { PlanTier, BillingCycle };

/** The two self-serve tiers (Enterprise is sales-led, never via Checkout). */
export type PaidPlan = "solo" | "operator";

export const TIER_LABEL: Record<PlanTier, string> = {
  solo: "Solo",
  operator: "Operator",
  enterprise: "Enterprise",
};

// Flat per-location monthly prices.
export const SOLO_PRICE = 59;
export const OPERATOR_PRICE = 79;

/**
 * The org's effective tier. Self-serve tier derives purely from location count
 * (1 → Solo, 2+ → Operator), so it can never drift from reality; `plan` only
 * needs to mark Enterprise (set manually after a sales deal).
 */
export function effectiveTier(org: {
  plan: string;
  location_count: number;
}): PlanTier {
  if (org.plan === "enterprise") return "enterprise";
  return deriveTier(org.location_count);
}

/** Self-serve tier from a raw location count. */
export function deriveTier(locationCount: number): PlanTier {
  return locationCount >= 2 ? "operator" : "solo";
}

/** Flat per-location monthly price for a self-serve tier. */
export function perLocationPrice(tier: PlanTier): number {
  return tier === "operator" ? OPERATOR_PRICE : SOLO_PRICE;
}

/**
 * Monthly base price in dollars (display/MRR). Solo = $59 (one location);
 * Operator = $79 × locations; Enterprise = max($2,500 floor, $50/loc).
 */
export function monthlyBasePrice(tier: PlanTier, locations: number): number {
  switch (tier) {
    case "solo":
      return SOLO_PRICE;
    case "operator":
      return OPERATOR_PRICE * Math.max(2, locations);
    case "enterprise":
      return Math.max(2500, 50 * locations);
  }
}

export interface PlanLimits {
  tier: PlanTier;
  seats: number | null; // null = unlimited
}

/** Seat allowance per tier (assessments are unlimited on every tier). */
export function planLimits(tier: PlanTier, locations: number): PlanLimits {
  const loc = Math.max(1, locations);
  switch (tier) {
    case "solo":
      return { tier, seats: 2 };
    case "operator":
      return { tier, seats: 2 + loc };
    case "enterprise":
      return { tier, seats: null };
  }
}

// ── Feature gating ──────────────────────────────────────────────────────
// The Operator premium buys these; this is the authoritative map.
export type Feature =
  | "sms" //                      candidate SMS (notifications + comms)
  | "ai_job_descriptions" //      AI-written job posts
  | "unified_login" //            one login across all locations
  | "multi_location_careers" //   one careers page across stores
  | "cross_location_benchmark" // compare candidates across stores
  | "testing_modules" //          extra role-specific assessment modules
  | "advanced_eeo" //             government-style fairness reports
  | "brand_hierarchy" //          cross-brand rollup
  | "sso" //                      single sign-on
  | "api"; //                     developer API

export function hasFeature(
  tier: PlanTier,
  feature: Feature,
  locations = 1
): boolean {
  const operatorPlus = tier === "operator" || tier === "enterprise";
  switch (feature) {
    case "sms":
    case "ai_job_descriptions":
    case "unified_login":
    case "cross_location_benchmark":
    case "testing_modules":
    case "advanced_eeo":
      return operatorPlus;
    case "multi_location_careers":
      return operatorPlus && locations >= 2;
    case "brand_hierarchy":
    case "sso":
    case "api":
      return tier === "enterprise";
  }
}
