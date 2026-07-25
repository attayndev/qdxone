# QDX One — MVP Overview & Scope

*Last updated 2026-06-13. This is a self-contained briefing — it assumes no
access to the codebase. Share it as-is.*

---

## 1. What it is

**QDX One** (`qdx.one`) is an **inbound applicant intake + screening platform for
restaurants**. "QDX" = *Questions Deliver Excellence.*

A restaurant operator gets a branded careers page, takes job applications through
it, and every applicant completes a short, validated behavioral assessment. The
operator sees a scored, ranked view of who applied — so they spend interview time
on the people most likely to show up, own their shift, and treat guests well.

It is **specialized for restaurants** right now (independents up to multi-unit
franchise groups). The architecture is general enough to expand to other
small-business hiring later, but that is explicitly out of scope for the MVP.

**Design principle: score, don't filter.** The assessment never auto-rejects
anyone. It surfaces verbal bands and an overall fit tier to help the operator
prioritize — the human always decides.

---

## 2. Who it's for

- **Independent single-location restaurants** — the core self-serve buyer.
- **Franchisees / small groups** — multiple locations under one account, or each
  location paying for itself.
- **Brands / large multi-unit groups** — handled as a "talk-to-us" tier (manual
  setup, hierarchy, SSO).

The hiring volume is high-turnover, hourly front-line roles (team member, cook,
shift lead, etc.). The assessment is deliberately tuned to be **quick yet
accurate** — "an omelet, not a beef wellington."

---

## 3. Core product flow

1. **Operator onboards** (self-serve signup) → gets a subdomain
   (`yourstore.qdx.one`) with a branded careers page.
2. **Operator configures** their store: roles (with optional AI-written job
   descriptions), which application fields are required/optional/hidden, and
   custom questions.
3. **Operator posts a job** → gets a shareable link + QR code for the storefront,
   socials, etc.
4. **Candidate applies** from their phone (no login, no app) — a short
   application, then the **~5-minute assessment**.
5. **Scoring engine** evaluates the assessment → verbal bands per category + an
   overall fit tier + quality/screener flags.
6. **Operator reviews** a ranked candidate pipeline with per-candidate report
   cards; strong candidates trigger an alert (email/SMS).
7. **Voluntary EEO** data is collected separately and surfaced only as
   aggregate, suppressed fairness reporting.

### Key flexibility
- **Application and assessment are decoupled.** An operator can send an
  assessment to someone without a full application (just first/last name, email,
  optional mobile), or require the application first.
- **Review-first mode.** Optionally, the operator reviews an application before
  the assessment auto-sends — filters out joke/spam submissions before they burn
  quota.

---

## 4. The assessment (methodology)

- **Fixed length: 30 items** per candidate — 28 scored personality items + 2
  attention checks woven in. Plus a few short screener questions.
- Items are drawn from a **growing item bank** and selected per candidate via a
  stratified, exposure-rotated, keying-balanced algorithm — so the *bank* grows
  over time but each candidate always answers a consistent 30.
- **Format:** 5-point Likert (Strongly disagree → Strongly agree), mobile-first,
  plain language, resumable for 72 hours.
- **Traits measured** (eight facets): Dependability, Achievement, Customer
  Warmth, Team Cooperation, Coachability, Internal Locus of Control, Initiative &
  Ownership, Composure. These roll up into a small set of categories and an
  overall fit tier.
- **Scoring:** reverse-keyed items corrected, facet means → equal-weight category
  means → verbal bands (High / Mid / Low). An **overall fit tier** (4 levels)
  with an ownership/self-direction gate. An **attitude composite** (coachability
  + customer warmth + team cooperation). **Screener flags** for knockout-style
  responses, plus careless-response/attention-check quality flags.
- **Operators see verbal bands and tiers**, never raw numbers (numbers live in
  the database for analysis).

The billable unit is a **completed candidate assessment** — applicants who don't
finish cost nothing, which protects operators from spam/bogus applications.

---

## 5. Pricing & packaging

**Full detail: [`docs/pricing-strategy-v1.md`](./pricing-strategy-v1.md)** — that
is the source of truth; this is the summary. Per-location pricing. Two self-serve
tiers (Solo, Operator) + a sales-led tier (Enterprise). 30-day free trial; card
captured at signup, first charge after the trial.

**Flat per-location pricing with UNLIMITED assessments on every tier** — no caps,
no metered overage. The Operator premium ($20/location) buys **features, not
volume**. Enterprise is sales-led.

| | **Solo** | **Operator** | **Enterprise** |
|---|---|---|---|
| **For** | 1 location | 2+ locations (self-serve) | brands / large or multi-brand groups |
| **Price** | $59/mo per location | $79/mo per location (flat) | $2,500/mo floor + $50/loc |
| **Annual** | 2 months free ($590/yr) | 2 months free ($790/yr) | Annual standard |
| **Assessments** | Unlimited | Unlimited | Unlimited |
| **Seats** | 2 | 2 + 1/location | Unlimited |
| Careers page + QR · assessment · pipeline | ✓ | ✓ | ✓ |
| Local crew benchmark · basic fairness checks | ✓ | ✓ | ✓ |
| Email notifications | ✓ | ✓ | ✓ |
| **Unified login across stores** | n/a | ✓ | ✓ |
| **SMS notifications + candidate texting** | — | ✓ | ✓ |
| **AI-written job posts** | — | ✓ | ✓ |
| Multi-location careers page · cross-store reports | n/a | ✓ | ✓ |
| Extra testing modules (roadmap) | — | ✓ | ✓ |
| Brand hierarchy · SSO/SAML/SCIM · API · CSM | — | — | ✓ |

**Why unlimited:** assessments cost ~nothing to deliver (deterministic scoring),
so we gate the things that actually cost money (SMS, AI) and give the cheap thing
away — which also removes the friction of a cap biting during a hiring rush.
**Consequence:** SMS + AI are Operator-only, and Operator = 2+ locations, so a
single store can't get SMS/AI yet (acceptable; Solo add-ons possible later).

**Roadmap — integrations (Operator/Enterprise, post-beta):** rather than build
scheduling or payroll, *integrate*.
- **Post-hire push:** after a hire, send the new employee into the operator's
  **POS (Toast)** and **scheduler** (WhenIWork / Homebase / 7shifts) — "hire → it
  lands in Toast / your schedule."
- **Job syndication:** push open postings out to boards — **Google for Jobs**
  (free JSON-LD structured data, possibly a baseline for all tiers), **Indeed**
  (job feed; organic free), **Facebook** (share-to-Page link only — FB Jobs API
  was discontinued), others later.
High-value adjacency + real lock-in, far cheaper than building those products.

---

## 6. Compliance & fairness posture

- **EEO data** (race, gender, veteran, disability) is **voluntary** and stored in
  a separate, access-restricted partition — never visible per-candidate to the
  operator.
- Operators (on the relevant tier) see only **aggregate fairness reporting** with
  **small-cell suppression** (groups under a threshold are hidden) and
  **four-fifths-rule adverse-impact flagging**.
- The "score, don't filter" rule and verbal-band presentation are part of keeping
  the tool a decision-support aid, not an automated gate.

---

## 7. Architecture (high level)

- **Next.js (App Router) + React + TypeScript + Tailwind**, deployed on
  **Cloudflare** (a Worker fronting a Container that runs the full Node/Next 16
  image, so `proxy.ts` middleware runs unchanged).
- **Supabase** (Postgres + Auth + row-level security) for data and magic-link
  auth. A service-role path handles the restricted EEO partition (its `eeo`
  schema must be in the Data API's exposed-schemas list).
- **Multi-tenancy by subdomain** (`<slug>.qdx.one`), with all data keyed on an
  org id — the subdomain is a thin, swappable routing layer, so the tenancy model
  can evolve (e.g. brand hierarchies) without re-architecting the data.
- **Stripe** for subscriptions, metered overage (usage meter), and the billing
  portal.
- **Anthropic API directly** (Claude Haiku) for AI-written job descriptions.
- **Resend** for email, **Telnyx** for SMS (candidate SMS gated on TCPA consent).
- **Google Calendar** (OAuth, single multi-tenant app; encrypted tokens) for the
  native interview-scheduling module; a **Cloudflare cron** drains the scheduling
  outbox (calendar events + emails).
- **Hosted on Cloudflare** (Worker + Container, real Node/Next 16 incl.
  `proxy.ts`); `qdx.one` DNS is on Cloudflare, pointed at the Worker. Adding a
  server secret = `wrangler secret put` **plus** a line in `CONTAINER_SECRETS`.

---

## 8. Current build state (as of 2026-06-29)

**Shipped since the June beta cut (live on Cloudflare, verified in prod):**
- **Stripe billing wired + verified end-to-end (TEST mode)** — Solo/Operator
  products + 4 prices, webhook, 6 wrangler secrets; a `4242` signup stamped the
  org's customer/subscription. Live mode = repeat with `sk_live_`/live prices.
- **SMS via Telnyx — fully wired** (number/profile/key/webhook/secrets, consent-
  gated candidate texts); **awaiting A2P 10DLC campaign approval** before live.
- **Per-channel operator notifications** — independent Email vs Text toggles per
  event (new application / assessment done / strong fit).
- **Google for Jobs (syndication Phase 1–2)** — `JobPosting` JSON-LD (w/
  `baseSalary`) on apply pages + host-aware `sitemap.xml` (submitted to Search
  Console). robots.txt is Cloudflare-managed (allows search, blocks AI-train).
- **NY pay transparency + tips** — required good-faith pay range + period + a
  `tips` flag on postings; shown on the job ad, the postings list, and the
  JobPosting `baseSalary` (tips supplemental).
- **Commercial video** on the homepage + /about (Supabase Storage `marketing`).
- **Terms of Service + Privacy Policy** (`/terms`, `/privacy`) for Attayn Group
  LLC (DBA QDXone), NY law — footer links + signup clickwrap + an immutable
  `terms.accepted` audit record (version in `src/lib/legal.ts`). Plain-language
  drafts; **pending counsel review** before relied upon.
- **Candidate list filtering** — search + stage/role/decision filters and a
  default "hide decided" view (decision IS NOT NULL hidden, "Include decided"
  escape hatch); decided rows badged; counts stay full-pipeline totals.
- **Hosting migrated off Vercel → Cloudflare** (Workers + Containers running the
  real Node/Next 16 image). Secrets are forwarded into the container via an
  explicit `CONTAINER_SECRETS` allowlist in `worker/index.ts` (a new secret needs
  both `wrangler secret put` AND a line there).
- **AI moved off the Vercel AI Gateway → Anthropic API directly** (`@ai-sdk/anthropic@3`,
  `claude-haiku-4-5`, `ANTHROPIC_API_KEY`).
- **Interview scheduling (native module, Stages 2–7) — full loop live:** Google
  Calendar OAuth (AES-256-GCM encrypted tokens), per-interviewer weekly
  availability + interview types, a brand-themed candidate booking page
  (`<slug>.qdx.one/interview/[token]`) showing real slots (availability ∩ live
  Google free/busy), DB exclusion-constraint double-booking guarantee, a
  transactional outbox drained by a Cloudflare cron that creates the calendar
  event (Meet link for video) and sends confirmation/reminder emails as the
  store, an owner "upcoming interviews" list with cancel, and an
  **email-the-booking-link-to-candidate** button. Reschedule deferred to v2.
- **EEO data-loss bug fixed:** the `eeo` schema wasn't exposed to the Supabase
  API (PGRST106) so self-IDs were silently dropped — schema now exposed, service-
  role grants added (migration 0014), and the read/write paths hardened to log
  instead of swallowing.

**Done — the full Solo/Operator self-serve product is built (tsc + build green):**
- Pivot complete; pre-pivot single-tenant/invitation code + schema removed.
- Operator onboarding, branded careers pages (auto-grouped by store at 2+
  locations), application builder, roles + AI job descriptions, postings + QR
  (per-store), **multi-location management** (add/edit/remove stores — this is
  what makes the Operator tier reachable).
- Assessment delivery + scoring engine; candidate pipeline + report cards +
  strong-candidate alerts; **local crew benchmark** on the report card.
- Voluntary EEO + aggregate fairness; funnel/tier/by-role + **cross-store
  (by-location) reporting**.
- **Team management + seats** (invite/remove managers, per-plan seat limits).
- Notifications: email (Resend) + SMS (Telnyx); candidate SMS gated on a TCPA
  consent checkbox (unchecked default + stored proof).
- **Feature gating enforced**: SMS = Operator+, Solo AI job descriptions capped
  at 3/mo.
- **Pricing v1 + Stripe billing**: Solo $59 / Operator $79→$69 / Enterprise
  talk-to-us, location-count-driven via `src/lib/plan.ts`; checkout, capped
  metered overage, annual (2 months free), webhook sync, billing portal, and
  subscription quantity-sync on location change. Runbook: `docs/stripe-setup.md`.
- **Plain-language** marketing FAQ (`/faq`) + landing FAQ.
- Code on **GitHub** (`attayndev/qdxone`); app **deploys on Cloudflare**
  (`wrangler deploy`; branch `cloudflare-migration`).

**Remaining to go live — deploy, not features:**
1. Apply migrations: `npm run db:push` (0007–0010) + `npm run db:types`.
2. Vercel env vars + domains (`qdx.one` + `*.qdx.one`); DNS on Cloudflare pointed
   at Vercel (Vercel records set to DNS-only / grey-cloud); Supabase auth redirect
   URLs (`https://qdx.one/**`, `https://*.qdx.one/**`).
3. Stripe dashboard setup (`docs/stripe-setup.md`) — only needed before the first
   trials convert; a trial-only beta runs without it.
4. Final pre-beta QA pass (signup → store setup → post → apply → assess → review →
   EEO → reports → invite a manager → add a 2nd store → confirm Operator).
5. Items you own: counsel review of the legal FAQ answer, data-security specifics,
   and whether Spanish is a near-term priority.

**Backlog — legal follow-ups (ToS/Privacy now shipped):** the interim ToS +
Privacy are live with clickwrap + acceptance records, but still need **counsel
review**, and a **DPA** (data processing agreement) should be added to pair with
them before paid conversions.

**Next major epic (post-beta): skills assessment + 2-stage auto follow-up** — a
second, role-indexed assessment type sent automatically after the personality
screen, with its own item bank and per-role content-validity records. Full spec:
[`docs/skills-assessment-spec.md`](./skills-assessment-spec.md). (Its TCPA SMS
consent carve-out is already built.)

**Backlog — surface interview scheduling in marketing + onboarding (after the
scheduling epic ships end-to-end):** once candidates can actually book, update the
marketing pages (landing, /how-it-works, /for-qsr, /for-independents, pricing
feature lists) to advertise native interview scheduling — "invite candidates to
book a time, synced to your Google Calendar" — and update the onboarding wizard to
include a "connect your calendar / set availability" step so new owners set it up
during first-run. Do this when Stages 5–6 are live, not before (don't market a
flow candidates can't complete yet).

**Backlog — custom-questions discoverability + wizard step:** custom application
questions are org-level, role-indexed config, managed today on the Store page
(`branding.application_config.custom_questions`). Keep the editor there (questions
are stable/reused; postings are transient — moving them into Postings would imply
per-posting ownership and risk data loss). Instead: (1) add a Postings-side
shortcut — when creating/editing a posting for a role, show "Applicants for {role}
will be asked N custom questions — Edit →" deep-linking to the Store editor
(optionally pre-filtered to that role); (2) add an optional "Customize application
questions" step (lightbox) to the onboarding wizard. Discoverability fix, not a
data move.

**Backlog — internal super-admin console (after the calendar epic):** a
QDX-staff-only panel to see and manage every customer org — list/search orgs,
their plan + location count, member roster, signup date, and activity (postings,
applications, assessments); impersonate/"view as" for support; suspend or delete
an org; surface billing state once Stripe is on. This is distinct from the
per-tenant `/admin` (which an owner sees for *their* org) — it's a platform
back-office gated to QDX staff only (a `platform_admins` allow-list or a flag on
the user, NOT an org role), reachable on an internal route/subdomain and never
exposed to tenant subdomains. Build after interview scheduling ships.

---

## 9. Good questions to bring to a strategy chat

- Pricing: the open decisions in [pricing-strategy-v1](./pricing-strategy-v1.md)
  (enterprise white-glove scope, trial structure, annual magnitude, a sub-Solo
  free/Tester tier, multi-brand handling).
- Go-to-market: who are the first 5–10 beta restaurants, and what's the single
  metric that says the assessment is "working" for them?
- The assessment: is 30 items / ~5 minutes the right accuracy-vs-friction point
  for hourly restaurant roles, and how do we validate predictive value over time?
- Compliance: how far to lean into the EEO/fairness story as a differentiator
  vs. keeping it quiet to avoid scaring small operators.
- Expansion: when (if ever) to broaden beyond restaurants, and what that does to
  the assessment content and positioning.
