import { adminClient } from "./supabase/admin";
import { stripe, priceForPlan, overagePrice } from "./stripe";
import { orgUrl } from "./tenancy";

/**
 * Create a Stripe Checkout Session for a brand-new monthly subscriber.
 * Returns the redirect URL.
 */
export async function createCheckoutSessionForOrg(args: {
  orgId: string;
  orgSlug: string;
  plan: "starter" | "growth";
  cycle: "annual" | "monthly";
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
    line_items: [
      { price: priceForPlan(args), quantity: 1 },
      { price: overagePrice(args.cycle) }, // metered
    ],
    subscription_data: {
      metadata: {
        org_id: args.orgId,
        plan: args.plan,
        cycle: args.cycle,
      },
      // Annual plans get a 7-day trial. Monthly plans don't.
      trial_period_days: args.cycle === "annual" ? 7 : undefined,
    },
    metadata: {
      org_id: args.orgId,
      plan: args.plan,
      cycle: args.cycle,
    },
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

/**
 * Report a single overage usage event to Stripe. Called from
 * `recordUsage` when an applicant submission pushes the org past its
 * monthly quota.
 */
export async function reportOverageToStripe(args: {
  orgId: string;
  typeKey: "questionnaire" | "cashier_math" | "iq";
}): Promise<void> {
  const supa = adminClient();
  const { data: tt } = await supa
    .from("org_test_types")
    .select("stripe_subscription_item_id")
    .eq("org_id", args.orgId)
    .eq("type_key", args.typeKey)
    .maybeSingle();
  const itemId = tt?.stripe_subscription_item_id;
  if (!itemId) return; // not yet linked (e.g. trial or no Stripe configured)

  // Stripe v18+ uses meter events; for compatibility we use the older
  // usage_records API (works on all current Stripe API versions for
  // metered prices). Either way, this increments by 1.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (stripe() as any).subscriptionItems.createUsageRecord(itemId, {
    quantity: 1,
    timestamp: Math.floor(Date.now() / 1000),
    action: "increment",
  });
}
