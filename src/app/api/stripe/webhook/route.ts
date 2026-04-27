import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
        const sub = await stripe().subscriptions.retrieve(subId, {
          expand: ["items.data.price"],
        });

        await supa
          .from("organizations")
          .update({
            stripe_subscription_id: sub.id,
            plan:
              session.metadata?.plan === "growth" ? "growth" : "starter",
            billing_cycle:
              session.metadata?.cycle === "monthly" ? "monthly" : "annual",
            status: "active",
          })
          .eq("id", orgId);

        // Find the metered overage item and persist its id so we can
        // increment usage against it later.
        const overageItem = sub.items.data.find(
          (it) => it.price.recurring?.usage_type === "metered"
        );
        if (overageItem) {
          await supa
            .from("org_test_types")
            .update({ stripe_subscription_item_id: overageItem.id })
            .eq("org_id", orgId)
            .eq("type_key", "questionnaire");
        }

        await supa.from("audit_events").insert({
          org_id: orgId,
          kind: "billing.checkout_completed",
          meta: { subscription_id: sub.id },
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;
        const status =
          sub.status === "canceled" || sub.status === "unpaid"
            ? "canceled"
            : sub.status === "past_due"
              ? "past_due"
              : "active";
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
