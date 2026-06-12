# Stripe setup

What to create in your Stripe dashboard so QDX billing works. Do it in **Test
mode** first, then repeat the prices in **Live mode** (price IDs differ per
mode). The app reads everything by **price ID** from env vars — no amounts are
hardcoded.

Billing model recap:
- **Starter** — $49/mo (or $490/yr, 2 months free) · 25 completed assessments/mo
  included, then **$3** per extra · 1 user.
- **Growth** — $99/mo (or $990/yr) · 75 included, then **$2** per extra · 3 users.
- **Multi-unit** — talk-to-us, set manually. No Stripe Checkout.

A subscription carries **two items**: the flat base price + a metered overage
price. Stripe requires every recurring price on a subscription to share one
billing interval, so each plan has the overage price in **both** intervals
(monthly and annual) and we attach the one matching the chosen cycle.

The billable unit is a **completed candidate assessment past the monthly quota**.
The app counts completions itself and emits one meter event only for over-quota
ones — so the metered price is a simple flat per-unit amount (no Stripe-side
tiers/free allotment needed).

---

## 1. Billing Meter

Billing → Meters → **Create meter**.

- **Event name:** `assessment_completed`  ← must match `ASSESSMENT_METER_EVENT`
- **Aggregation:** Sum
- **Value setting / payload key:** `value` (the default)
- **Customer mapping / payload key:** `stripe_customer_id` (the default)

Keep the defaults for the two payload keys — the app sends
`{ stripe_customer_id, value: "1" }`.

## 2. Products + prices

Create two products: **QDX Starter** and **QDX Growth**. On each, add four
prices. (Tip: Stripe lets you add multiple prices to one product.)

### QDX Starter
| Price | Type | Amount | Interval | → env var |
|---|---|---|---|---|
| Base monthly | Flat (licensed) | $49.00 | Monthly | `STRIPE_PRICE_STARTER_MONTHLY` |
| Base annual | Flat (licensed) | $490.00 | Yearly | `STRIPE_PRICE_STARTER_ANNUAL` |
| Overage monthly | **Usage-based**, meter `assessment_completed` | $3.00 / unit | Monthly | `STRIPE_PRICE_STARTER_OVERAGE_MONTHLY` |
| Overage annual | **Usage-based**, meter `assessment_completed` | $3.00 / unit | Yearly | `STRIPE_PRICE_STARTER_OVERAGE_ANNUAL` |

### QDX Growth
| Price | Type | Amount | Interval | → env var |
|---|---|---|---|---|
| Base monthly | Flat (licensed) | $99.00 | Monthly | `STRIPE_PRICE_GROWTH_MONTHLY` |
| Base annual | Flat (licensed) | $990.00 | Yearly | `STRIPE_PRICE_GROWTH_ANNUAL` |
| Overage monthly | **Usage-based**, meter `assessment_completed` | $2.00 / unit | Monthly | `STRIPE_PRICE_GROWTH_OVERAGE_MONTHLY` |
| Overage annual | **Usage-based**, meter `assessment_completed` | $2.00 / unit | Yearly | `STRIPE_PRICE_GROWTH_OVERAGE_ANNUAL` |

For each **usage-based** price: pricing model = "Per unit", and select the
`assessment_completed` meter. Both overage prices reference the **same** meter —
a customer only ever has one of them on their subscription, so usage maps
cleanly.

## 3. Webhook endpoint

Developers → Webhooks → **Add endpoint**.

- **URL:** `https://qdx.one/api/stripe/webhook`
- **Events:** `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.payment_failed`
- Copy the **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.

## 4. Env vars

Set these (test values for local/preview, live values for production):

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_STARTER_OVERAGE_MONTHLY=price_...
STRIPE_PRICE_STARTER_OVERAGE_ANNUAL=price_...
STRIPE_PRICE_GROWTH_MONTHLY=price_...
STRIPE_PRICE_GROWTH_ANNUAL=price_...
STRIPE_PRICE_GROWTH_OVERAGE_MONTHLY=price_...
STRIPE_PRICE_GROWTH_OVERAGE_ANNUAL=price_...
```

After setting env vars, **restart `npm run dev`** (env is read at startup).
On Vercel, add them under Project → Settings → Environment Variables and redeploy.

## 5. Local testing

```
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook   # prints whsec_ → put in .env.local
```

Then sign up at `http://<slug>.localhost:3000/signup`, pick a plan + cycle, and
complete Checkout with test card `4242 4242 4242 4242`. Verify:
- `organizations` row gets `stripe_customer_id`, `stripe_subscription_id`,
  `plan`, `billing_cycle`, `status=trialing`.
- To test overage, set the org's `monthly_assessment_quota` low (e.g. 1),
  complete two candidate assessments, and confirm a meter event lands in
  Billing → Meters → `assessment_completed`.

## Notes / gotchas

- **Trial:** 30 days, card captured at signup (`payment_method_collection:
  "always"`), auto-converts. The proxy gates `/admin` once the trial expires
  (status drives it via the webhook).
- **Annual overage timing:** on annual subs, metered usage invoices at the
  yearly renewal (Stripe bills metered usage at period end). Acceptable; the
  units are still tallied as they happen.
- **Plan/cycle change in the portal:** handled — `customer.subscription.updated`
  re-derives plan, cycle, and quota from the subscription's base price.
- **Multi-unit:** never goes through Checkout. Set `plan='multi_unit'` (and any
  custom `monthly_assessment_quota`) directly on the org after the deal closes.
