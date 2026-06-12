import { adminClient } from "./supabase/admin";
import { stripe, priceForPlan, type PaidPlan } from "./stripe";
import { orgUrl } from "./tenancy";

/**
 * Create a Stripe Checkout Session for a new subscriber. Monthly per-location
 * subscription with a 30-day trial; the card is captured at checkout
 * (`payment_method_collection: 'always'`) and auto-charges when the trial
 * ends. No metered/overage line item — the model is upgrade-the-tier.
 */
export async function createCheckoutSessionForOrg(args: {
  orgId: string;
  orgSlug: string;
  plan: PaidPlan;
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

  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [{ price: priceForPlan(args.plan), quantity: 1 }],
    // Capture the card during the 30-day trial so it auto-converts.
    payment_method_collection: "always",
    subscription_data: {
      trial_period_days: 30,
      metadata: { org_id: args.orgId, plan: args.plan },
    },
    metadata: { org_id: args.orgId, plan: args.plan },
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
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

