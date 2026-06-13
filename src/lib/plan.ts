// ─────────────────────────────────────────────────────────────────────
// Pricing v1 — the single source of truth for tiers, limits, and features.
// ─────────────────────────────────────────────────────────────────────
// Tier is driven by LOCATION COUNT for self-serve; Enterprise is a manual flag.
// Limits (quota / seats / overage cap) and Operator's volume price all scale
// per location. Everything that needs "what can this org do / what does it
// cost" should compute from here — do not hardcode tier numbers elsewhere.
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

/**
 * Self-serve per-location price by TOTAL location count (Stripe volume tiers:
 * every location bills at the band for the total). A flat $69/location until
 * 10 locations, then $59/location. Same rate for Solo (1 location) and
 * Operator — the tier difference is features + one account, not price.
 */
export function operatorPerLocation(locations: number): number {
  return locations >= 10 ? 59 : 69;
}

/**
 * Monthly base price in dollars (display/MRR). Solo = $69 (one location);
 * Operator = per-location rate × count; Enterprise = max($2,500 floor, $50/loc).
 */
export function monthlyBasePrice(tier: PlanTier, locations: number): number {
  switch (tier) {
    case "solo":
      return operatorPerLocation(1);
    case "operator": {
      const n = Math.max(2, locations);
      return operatorPerLocation(n) * n;
    }
    case "enterprise":
      return Math.max(2500, 50 * locations);
  }
}

export interface PlanLimits {
  tier: PlanTier;
  seats: number | null; //               null = unlimited
  monthlyQuota: number | null; //        included assessments/mo; null = unlimited
  overagePerAssessment: number; //       $ per completed assessment past quota
  overageCapDollars: number | null; //   monthly $ ceiling on overage; null = none
  aiJobDescriptionsPerMonth: number | null; // null = unlimited
}

/** Resolve all numeric limits for a tier at a given location count. */
export function planLimits(tier: PlanTier, locations: number): PlanLimits {
  const loc = Math.max(1, locations);
  switch (tier) {
    case "solo":
      return {
        tier,
        seats: 2,
        monthlyQuota: 25,
        overagePerAssessment: 3,
        overageCapDollars: 25,
        aiJobDescriptionsPerMonth: 3,
      };
    case "operator":
      return {
        tier,
        seats: 2 + loc,
        monthlyQuota: 50 * loc,
        overagePerAssessment: 2,
        overageCapDollars: 50 * loc,
        aiJobDescriptionsPerMonth: null,
      };
    case "enterprise":
      return {
        tier,
        seats: null,
        monthlyQuota: null,
        overagePerAssessment: 0,
        overageCapDollars: null,
        aiJobDescriptionsPerMonth: null,
      };
  }
}

/** Max billable overage units in a month given the cap (Infinity if uncapped). */
export function overageUnitCap(limits: PlanLimits): number {
  if (limits.overageCapDollars === null) return Infinity;
  if (limits.overagePerAssessment <= 0) return 0;
  return Math.floor(limits.overageCapDollars / limits.overagePerAssessment);
}

// ── Feature gating ──────────────────────────────────────────────────────
// Enforcement is rolled out as a fast-follow; this is the authoritative map.
export type Feature =
  | "sms"
  | "multi_location_careers"
  | "cross_location_benchmark"
  | "advanced_eeo"
  | "brand_hierarchy"
  | "sso"
  | "api";

export function hasFeature(
  tier: PlanTier,
  feature: Feature,
  locations = 1
): boolean {
  const operatorPlus = tier === "operator" || tier === "enterprise";
  switch (feature) {
    case "sms":
    case "advanced_eeo":
    case "cross_location_benchmark":
      return operatorPlus;
    case "multi_location_careers":
      return operatorPlus && locations >= 2;
    case "brand_hierarchy":
    case "sso":
    case "api":
      return tier === "enterprise";
  }
}
