import { adminClient } from "./supabase/admin";
import {
  stripe,
  basePriceFor,
  overagePriceFor,
  ASSESSMENT_METER_EVENT,
  type PaidPlan,
} from "./stripe";
import type { BillingCycle } from "./supabase/types";
import { orgUrl } from "./tenancy";

/**
 * Create a Stripe Checkout Session for a new subscriber. Per-location
 * subscription on the chosen billing cycle (monthly or annual = 2 months free)
 * with a 30-day trial; the card is captured at checkout
 * (`payment_method_collection: 'always'`) and auto-charges when the trial ends.
 * The subscription carries two items: the flat base price + a metered overage
 * price ($3/Starter, $2/Growth per completed assessment past the quota).
 */
export async function createCheckoutSessionForOrg(args: {
  orgId: string;
  orgSlug: string;
  plan: PaidPlan;
  cycle: BillingCycle;
  email: string;
}): Promise<string> {
  const supa = adminClient();
  const s = stripe();

  // Find or create a Stripe customer for the org.
  const { data: org } = await supa
    .from("organizations")
    .select("stripe_customer_id, name")
    .eq("id", args.orgId)
    .single();
  let customerId = org?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await s.customers.create({
      email: args.email,
      name: org?.name ?? args.orgSlug,
      metadata: { org_id: args.orgId, org_slug: args.orgSlug },
    });
    customerId = customer.id;
    await supa
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", args.orgId);
  }

  const successUrl = orgUrl(args.orgSlug, "/admin/billing?success=1");
  const cancelUrl = orgUrl(args.orgSlug, "/admin/billing?canceled=1");

  // Base (flat, qty 1) + overage (metered, no quantity).
  const lineItems: { price: string; quantity?: number }[] = [
    { price: basePriceFor(args.plan, args.cycle), quantity: 1 },
  ];
  const overage = overagePriceFor(args.plan, args.cycle);
  if (overage) lineItems.push({ price: overage });

  const meta = { org_id: args.orgId, plan: args.plan, cycle: args.cycle };
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: lineItems,
    // Capture the card during the 30-day trial so it auto-converts.
    payment_method_collection: "always",
    subscription_data: { trial_period_days: 30, metadata: meta },
    metadata: meta,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

/**
 * Bill one unit of overage when a completed candidate assessment lands past the
 * org's included monthly quota. Idempotent per session (Stripe dedups meter
 * events by `identifier`). No-op for unlimited plans, orgs without a Stripe
 * customer, or when Stripe isn't configured — safe to call on every completion.
 */
export async function reportAssessmentForOverage(args: {
  orgId: string;
  sessionId: string;
}): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY) return;
  const supa = adminClient();
  const { data: org } = await supa
    .from("organizations")
    .select("stripe_customer_id, monthly_assessment_quota")
    .eq("id", args.orgId)
    .single();
  if (!org?.stripe_customer_id) return;
  const quota = org.monthly_assessment_quota;
  if (quota === null) return; // unlimited plan → no overage

  // Completed candidate assessments this calendar month (this one included).
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
  const { count } = await supa
    .from("assessment_sessions")
    .select("*", { count: "exact", head: true })
    .eq("org_id", args.orgId)
    .eq("subject_type", "candidate")
    .eq("status", "complete")
    .gte("completed_at", monthStart);
  const used = count ?? 0;
  if (used <= quota) return; // still within the included allotment

  await stripe().billing.meterEvents.create({
    event_name: ASSESSMENT_METER_EVENT,
    identifier: args.sessionId, // dedup: at most one billable unit per session
    payload: { stripe_customer_id: org.stripe_customer_id, value: "1" },
  });
}

/**
 * Open the Stripe Billing Portal for an org's customer.
 */
export async function createBillingPortalUrlForOrg(args: {
  orgId: string;
  orgSlug: string;
}): Promise<string> {
  const supa = adminClient();
  const { data: org } = await supa
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", args.orgId)
    .single();
  if (!org?.stripe_customer_id) {
    throw new Error("No Stripe customer for this organization");
  }
  const portal = await stripe().billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: orgUrl(args.orgSlug, "/admin/billing"),
  });
  return portal.url;
}

