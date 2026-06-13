# Stripe setup

What to create in your Stripe dashboard so QDX billing works. Do it in **Test
mode** first, then repeat the prices in **Live mode** (price IDs differ per
mode). The app reads everything by **price ID** from env vars — no amounts are
hardcoded. Full pricing rationale: `docs/pricing-strategy-v1.md`.

Billing model recap (pricing v1):
- **Solo** — $69/mo (or $690/yr, 2 months free) per location · 1 location ·
  25 completed assessments/mo, then **$3** each, **capped $25/mo** · 2 users.
- **Operator** — flat **$69/loc (1–9)**, **$59/loc (10+)** · 50 assessments/loc/mo,
  then **$2** each, **capped $50/loc/mo** · 2 + 1/location users. (Same per-location
  rate as Solo — the tier difference is features + one account, not price.)
- **Enterprise** — $2,500/mo floor + $50/loc. Talk-to-us, set manually. No Checkout.

A subscription carries **two items**: the base price + a metered overage price.
Stripe requires every recurring price on a subscription to share one billing
interval, so each plan has the overage price in **both** intervals (monthly and
annual) and we attach the one matching the chosen cycle.

Solo's base is **flat** (quantity 1). Operator's base is a **volume-tiered**
price billed at **quantity = location count**, so the right band applies to the
whole account. The billable overage unit is a **completed candidate assessment
past the monthly quota**; the app counts completions and emits one meter event
only for billable over-quota ones (and stops at the monthly $ cap), so the
metered price is a simple flat per-unit amount.

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

Create two products: **QDX Solo** and **QDX Operator**. On each, add four prices.

### QDX Solo  (flat base, quantity 1)
| Price | Type | Amount | Interval | → env var |
|---|---|---|---|---|
| Base monthly | Flat (licensed) | $69.00 | Monthly | `STRIPE_PRICE_SOLO_MONTHLY` |
| Base annual | Flat (licensed) | $690.00 | Yearly | `STRIPE_PRICE_SOLO_ANNUAL` |
| Overage monthly | **Usage-based**, meter `assessment_completed` | $3.00 / unit | Monthly | `STRIPE_PRICE_SOLO_OVERAGE_MONTHLY` |
| Overage annual | **Usage-based**, meter `assessment_completed` | $3.00 / unit | Yearly | `STRIPE_PRICE_SOLO_OVERAGE_ANNUAL` |

### QDX Operator  (volume-tiered base, quantity = location count)
Set the base prices' pricing model to **Volume** with these tiers (per-unit):

| Tier (units = locations) | Per-unit |
|---|---|
| 1–9 | $69 |
| 10+ | $59 |

| Price | Type | Amount | Interval | → env var |
|---|---|---|---|---|
| Base monthly | **Volume** (tiers above) | per table | Monthly | `STRIPE_PRICE_OPERATOR_MONTHLY` |
| Base annual | **Volume** (×10 for 2-mo-free) | per table | Yearly | `STRIPE_PRICE_OPERATOR_ANNUAL` |
| Overage monthly | **Usage-based**, meter `assessment_completed` | $2.00 / unit | Monthly | `STRIPE_PRICE_OPERATOR_OVERAGE_MONTHLY` |
| Overage annual | **Usage-based**, meter `assessment_completed` | $2.00 / unit | Yearly | `STRIPE_PRICE_OPERATOR_OVERAGE_ANNUAL` |

For each **usage-based** price: pricing model = "Per unit", select the
`assessment_completed` meter. All overage prices reference the **same** meter —
a customer only ever has one on their subscription, so usage maps cleanly. The
app sets the Operator base item's **quantity** to the live location count.

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
STRIPE_PRICE_SOLO_MONTHLY=price_...
STRIPE_PRICE_SOLO_ANNUAL=price_...
STRIPE_PRICE_SOLO_OVERAGE_MONTHLY=price_...
STRIPE_PRICE_SOLO_OVERAGE_ANNUAL=price_...
STRIPE_PRICE_OPERATOR_MONTHLY=price_...
STRIPE_PRICE_OPERATOR_ANNUAL=price_...
STRIPE_PRICE_OPERATOR_OVERAGE_MONTHLY=price_...
STRIPE_PRICE_OPERATOR_OVERAGE_ANNUAL=price_...
```

After setting env vars, **restart `npm run dev`** (env is read at startup).
On Vercel, add them under Project → Settings → Environment Variables and redeploy.

## 5. Local testing

```
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook   # prints whsec_ → put in .env.local
```

Then sign up at `http://<slug>.localhost:3000/signup` (always creates a Solo,
1 location), pick a cycle, and complete Checkout with test card
`4242 4242 4242 4242`. Verify:
- `organizations` row gets `stripe_customer_id`, `stripe_subscription_id`,
  `plan`, `billing_cycle`, `status=trialing`.
- To test overage, complete more candidate assessments than the included quota
  in a month (Solo = 25) and confirm meter events land in Billing → Meters →
  `assessment_completed`, stopping once the $ cap's worth of units is reached.

## Notes / gotchas

- **Trial:** 30 days, card captured at signup (`payment_method_collection:
  "always"`), auto-converts. The proxy gates `/admin` once the trial expires
  (status drives it via the webhook).
- **Operator quantity sync (fast-follow):** when an org adds/removes a location,
  the Stripe subscription's Operator base **quantity** must update to the new
  location count, and a Solo→Operator move must swap the base price. Wire this
  alongside the volume prices above (the in-app tier/quota/seat/cap logic already
  tracks `location_count`).
- **Annual overage timing:** on annual subs, metered usage invoices at the yearly
  renewal (Stripe bills metered usage at period end). Acceptable; units are still
  tallied as they happen.
- **Plan/cycle change in the portal:** handled — `customer.subscription.updated`
  re-derives plan + cycle from the subscription's base price.
- **Enterprise:** never goes through Checkout. Set `plan='enterprise'` on the org
  after the deal closes (quota/seats then read as unlimited).
