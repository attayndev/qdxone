# qdx — pre-screening SaaS

Multi-tenant pre-screening platform for small-business owners. Owners
send a unique link to a candidate, who fills out a short questionnaire
on their phone. The owner gets back a scored, flagged report —
ownership, coachability, reliability, rule-fit, customer attitude.

- **Apex marketing site**: `qdx.one`
- **Per-org subdomain**: `<slug>.qdx.one` (e.g. `16handlesnewcity.qdx.one`)
- **Stack**: Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase · Stripe · Resend (optional) · Vercel

## Pricing model

| | **Annual** | **Monthly** |
|---|---|---|
| **Starter** (10 questionnaires) | $25/mo | $35/mo |
| **Growth** (25 questionnaires) | $50/mo | $65/mo |
| **Add-on test type** (5 included) | $10/mo | $15/mo |
| **Overage** (per extra test) | $3 | $4 |
| **Trial** | 7 days free | None |

- Annual signups get a 7-day free trial. Card is captured at checkout
  but only charged after the trial ends.
- Monthly signups are billed immediately.
- Overage is metered — Stripe usage records are pushed every time a
  candidate completes a questionnaire past the org's monthly quota.

## Local setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase

1. Create a project at <https://supabase.com>.
2. Apply the schema:
   ```bash
   export SUPABASE_PROJECT_REF=your-project-ref
   npx supabase login
   npm run db:link
   npm run db:push
   ```
   Or paste `supabase/migrations/0001_init.sql` then `0002_multitenant.sql` into the SQL Editor.
3. Copy your project URL, anon key, and service-role key into `.env.local`.

### 2b. Regenerate types

```bash
npm run db:types
```

### 3. Stripe

1. Create the products + prices in your Stripe dashboard:
   - **Starter Annual** — recurring, yearly, flat (e.g. $300/yr); price ID → `STRIPE_PRICE_STARTER_ANNUAL`
   - **Starter Monthly** — recurring, monthly, $35; → `STRIPE_PRICE_STARTER_MONTHLY`
   - **Growth Annual** — recurring, yearly, flat ($600/yr); → `STRIPE_PRICE_GROWTH_ANNUAL`
   - **Growth Monthly** — recurring, monthly, $65; → `STRIPE_PRICE_GROWTH_MONTHLY`
   - **Questionnaire Overage (Annual)** — recurring, monthly, **metered**, $3/unit; → `STRIPE_PRICE_OVERAGE_QUESTIONNAIRE_ANNUAL`
   - **Questionnaire Overage (Monthly)** — recurring, monthly, **metered**, $4/unit; → `STRIPE_PRICE_OVERAGE_QUESTIONNAIRE_MONTHLY`
2. In dev, run a webhook listener:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the signing secret it prints into `STRIPE_WEBHOOK_SECRET`.

### 4. Subdomains in dev

The app uses Host-header detection to figure out which org the visitor is on. In dev, two options:

- **`localhost`** — `http://<slug>.localhost:3000` works in Chrome/Safari/Firefox (no hosts-file edits needed).
- **`lvh.me`** — `http://<slug>.lvh.me:3000` resolves to 127.0.0.1 by design.

The apex is plain `http://localhost:3000` (or `http://lvh.me:3000`).

### 5. Run

```bash
npm run dev
```

- Apex marketing/signup: <http://localhost:3000>
- 16 Handles tenant (seeded): <http://16handlesnewcity.localhost:3000>

### 6. First sign-in

The `0002_multitenant.sql` seed creates the `16handlesnewcity` org and promotes anyone in the legacy `admins` table to its owner. To sign in:

1. Go to <http://localhost:3000/signup> to create your own org **or**
2. Manually insert an `org_members` row for an existing Supabase Auth user:
   ```sql
   insert into org_members (org_id, user_id, role)
   values ('00000000-0000-0000-0000-000000000001', 'YOUR-AUTH-UUID', 'owner');
   ```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│   apex (qdx.one)                       subdomain (<slug>.qdx.one)   │
│  ─────────────────                    ─────────────────────────     │
│   /          marketing                 /         org's hiring page   │
│   /pricing                             /invite/[token] welcome      │
│   /signup    creates org+sub           /apply/[token]  questionnaire│
│   /login     routes to user's org      /apply/[token]/thank-you     │
│   /super     operator dashboard        /admin/*  org-scoped admin   │
│   /auth/callback                       /admin/billing               │
│                                        /admin/settings              │
└─────────────────────────────────────────────────────────────────────┘
```

- **`src/proxy.ts`** — extracts `<slug>` from the Host header, sets it on `x-org-slug`, gates `/admin/*` to org members, redirects apex/subdomain conflicts.
- **`src/lib/tenancy.ts`** — `currentOrg()`, `requireMembership()`, `orgUrl()`, reserved-subdomain check.
- **Every admin/applicant query** is scoped by `org_id`.
- **RLS** allows org members to read/write only their own org's rows. The public applicant flow uses the service role from server actions.

## Multi-tenant data model

```
organizations
   ├─ org_members (owner | admin)
   ├─ org_test_types (questionnaire, cashier_math, iq, ...)
   │     └─ stripe_subscription_item_id (for metered reporting)
   ├─ usage_events (one per completed test)
   └─ invitations → applicants → responses, admin_notes, audit_events
```

## Stripe overage flow

1. Candidate submits a questionnaire → `submitApplication` server action.
2. `recordUsage()` checks the org's `monthly_quota` for `questionnaire`.
3. If used >= quota, the event is marked overage and `reportOverageToStripe()` posts a `+1` usage record to the org's metered subscription item.
4. Stripe invoices the overage at the end of the period via the card on file.
5. `customer.subscription.*`, `invoice.payment_failed`, and `checkout.session.completed` all flip the org's `status` field accordingly.

## Operator (you) workflow

- `/super` on the apex (gated to `PLATFORM_OWNER_EMAILS`) shows all orgs, MRR estimate, trial/past-due counts.
- Stripe dashboard remains the source of truth for revenue.

## Project structure

```
src/
├── app/
│   ├── (apex)
│   │   ├── page.tsx            Splits apex landing vs org landing
│   │   ├── pricing/
│   │   ├── signup/
│   │   ├── login/
│   │   ├── auth/callback/      Magic-link callback (apex + sub)
│   │   └── super/              Operator dashboard
│   ├── invite/[token]/         Branded welcome (per-org)
│   ├── apply/[token]/          Wizard questionnaire + thank-you
│   ├── admin/                  Org-scoped admin (login, dashboard,
│   │                           invitations, applicants, settings,
│   │                           billing)
│   └── api/stripe/webhook/
├── components/
│   ├── Brand.tsx               Per-org brand mark + footer
│   ├── landings/               OrgLanding + ApexLanding
│   ├── Questionnaire.tsx       Mobile-first wizard
│   ├── SignupForm.tsx
│   ├── LoginForm.tsx
│   └── admin/                  SettingsForm, InvitationsClient, etc.
├── lib/
│   ├── tenancy.ts              currentOrg, slug parsing, orgUrl
│   ├── usage.ts                quota + overage metering
│   ├── billing.ts              Stripe checkout, portal, usage record
│   ├── stripe.ts               singleton + price-id lookup
│   ├── invitations.ts          token gen + lookup (org-scoped)
│   ├── email.ts                Resend wrapper (org-aware)
│   ├── questionnaire/
│   │   ├── schema.ts           Q list + buildQuestions(branding)
│   │   └── scoring.ts          Category scoring + recommendation
│   └── supabase/               server, browser, admin clients + types
└── proxy.ts                    Subdomain detection + auth gate
supabase/migrations/
├── 0001_init.sql               Initial schema
└── 0002_multitenant.sql        Orgs, members, test types, usage; RLS rewrite
```

## Production deployment

1. Push to GitHub.
2. Import the repo at <https://vercel.com/new>.
3. Set all env vars from `.env.example`.
4. Add the apex domain (`qdx.one`) **and** a wildcard subdomain (`*.qdx.one`) under **Vercel → Domains**.
5. Configure your Stripe webhook endpoint to point at `https://qdx.one/api/stripe/webhook`.

## Tweaking the questionnaire

- Edit `src/lib/questionnaire/schema.ts` to add or change questions, weights, and risk flags.
- `buildQuestions(branding)` substitutes per-org wording (e.g. `phone_policy_text`) and can drop questions when a feature is disabled.
- Recommendation thresholds live in `src/lib/questionnaire/scoring.ts` (default 85 / 65 / 40 % of max).

## Security model

- **Subdomain auth gate** — `proxy.ts` requires a valid Supabase session AND `org_members` row matching the subdomain for any `/admin/*` route.
- **RLS** — every org-scoped table is read/written only via `is_org_member(org_id)`; admins of org A literally cannot see org B's data through Supabase clients.
- **Service role** — only used server-side for the public applicant flow and signup org creation. Never sent to the browser.
- **Stripe webhook** — verified via `STRIPE_WEBHOOK_SECRET` before any DB write.
- **Operator gate** — `/super` checks the signed-in user's email against `PLATFORM_OWNER_EMAILS`.
