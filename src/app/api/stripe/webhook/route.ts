import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PAID_PLANS = ["starter", "growth", "pro"];

function quotaForPlan(plan: string): number | null {
  return plan === "starter" ? 25 : plan === "growth" ? 100 : null; // pro = unlimited
}

function mapStatus(s: Stripe.Subscription.Status): string {
  if (s === "trialing") return "trialing";
  if (s === "active") return "active";
  if (s === "past_due" || s === "unpaid") return "past_due";
  return "canceled";
}

/**
 * Stripe webhook handler. Set STRIPE_WEBHOOK_SECRET to the value from
 *   stripe listen --forward-to <host>/api/stripe/webhook
 * (or your dashboard endpoint's signing secret).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET not set" },
      { status: 500 }
    );
  }
  const sig = request.headers.get("stripe-signature");
  if (!sig) return new NextResponse("missing signature", { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    console.error("webhook verification failed", e);
    return new NextResponse("bad signature", { status: 400 });
  }

  const supa = adminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;
        if (!orgId) break;

        // Pull subscription items so we can record the metered overage item
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (!subId) break;
        const sub = await stripe().subscriptions.retrieve(subId);
        const plan = PAID_PLANS.includes(session.metadata?.plan ?? "")
          ? (session.metadata!.plan as string)
          : "starter";

        await supa
          .from("organizations")
          .update({
            stripe_subscription_id: sub.id,
            plan,
            monthly_assessment_quota: quotaForPlan(plan),
            status: mapStatus(sub.status),
          })
          .eq("id", orgId);

        await supa.from("audit_events").insert({
          org_id: orgId,
          kind: "billing.checkout_completed",
          meta: { subscription_id: sub.id, plan },
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;
        const status = mapStatus(sub.status);
        await supa
          .from("organizations")
          .update({ status, stripe_subscription_id: sub.id })
          .eq("id", orgId);
        await supa.from("audit_events").insert({
          org_id: orgId,
          kind: `billing.${event.type}`,
          meta: { stripe_status: sub.status },
        });
        break;
      }

      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId =
          typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
        if (!customerId) break;
        const { data: org } = await supa
          .from("organizations")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (!org) break;
        await supa
          .from("organizations")
          .update({ status: "past_due" })
          .eq("id", org.id);
        await supa.from("audit_events").insert({
          org_id: org.id,
          kind: "billing.payment_failed",
          meta: { invoice_id: inv.id },
        });
        break;
      }

      default:
        // Ignore other events.
        break;
    }
  } catch (e) {
    console.error("webhook handler error", e);
    return new NextResponse("handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
