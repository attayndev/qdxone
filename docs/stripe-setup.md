# Stripe setup

What to create in your Stripe dashboard so QDX billing works. Do it in **Test
mode** first, then repeat in **Live mode** (price IDs differ per mode). The app
reads everything by **price ID** from env vars — no amounts are hardcoded. Full
pricing rationale: `docs/pricing-strategy-v1.md`.

Billing model (simple):
- **Solo** — $59/mo (or $590/yr, 2 months free) per location · 1 location · 2 users.
- **Operator** — $79/mo (or $790/yr) per location · 2+ locations · 2 + 1/location users.
- **Enterprise** — talk-to-us, set manually. No Checkout.

**Assessments are unlimited on every plan** — there is **no metered overage, no
caps, and no Billing Meter**. A subscription is just one flat base price. Solo
bills quantity 1; Operator bills quantity = location count (the app keeps that in
sync). The Operator premium ($20/location) is for features (unified login, SMS,
AI), not volume.

---

## 1. Products + prices

Create two products: **QDX Solo** and **QDX Operator**. Each gets two flat
(licensed) recurring prices — monthly and annual.

### QDX Solo
| Price | Type | Amount | Interval | → env var |
|---|---|---|---|---|
| Monthly | Flat (licensed) | $59.00 | Monthly | `STRIPE_PRICE_SOLO_MONTHLY` |
| Annual | Flat (licensed) | $590.00 | Yearly | `STRIPE_PRICE_SOLO_ANNUAL` |

### QDX Operator  (billed per location — app sets quantity)
| Price | Type | Amount | Interval | → env var |
|---|---|---|---|---|
| Monthly | Flat (licensed) | $79.00 | Monthly | `STRIPE_PRICE_OPERATOR_MONTHLY` |
| Annual | Flat (licensed) | $790.00 | Yearly | `STRIPE_PRICE_OPERATOR_ANNUAL` |

The Operator price is a normal per-unit recurring price; the app sets the
subscription item's **quantity** to the org's location count, so total = $79 ×
locations.

## 2. Webhook endpoint

Developers → Webhooks → **Add endpoint**.

- **URL:** `https://qdx.one/api/stripe/webhook`
- **Events:** `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.payment_failed`
- Copy the **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.

## 3. Env vars

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_SOLO_MONTHLY=price_...
STRIPE_PRICE_SOLO_ANNUAL=price_...
STRIPE_PRICE_OPERATOR_MONTHLY=price_...
STRIPE_PRICE_OPERATOR_ANNUAL=price_...
```

Set these in the Vercel project (Production + Preview). After changing env vars,
redeploy.

## 4. Local testing

```
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook   # prints whsec_ → put in .env.local
```

Sign up at `http://<slug>.localhost:3000/signup` (always creates a Solo, 1
location), pick a cycle, complete Checkout with test card `4242 4242 4242 4242`.
Verify the `organizations` row gets `stripe_customer_id`,
`stripe_subscription_id`, `plan`, `billing_cycle`, `status=trialing`.

## Notes

- **Trial:** 30 days, card captured at signup (`payment_method_collection:
  "always"`), auto-converts. The proxy gates `/admin` once the trial expires.
- **Location quantity sync:** when a store is added/removed, the app updates the
  Operator subscription's quantity (and swaps Solo↔Operator price on the
  1↔2-location boundary) — see `syncLocationBilling` in `src/lib/billing.ts`.
- **Plan/cycle change in the portal:** handled — `customer.subscription.updated`
  re-derives plan + cycle from the subscription's base price.
- **Enterprise:** never goes through Checkout. Set `plan='enterprise'` on the org
  after the deal closes.
