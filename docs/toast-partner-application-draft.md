# Toast Integration Partner Application — draft answers

Step 1 (API Documentation License Agreement) submitted **2026-07-14** as
Yan Tsirklin / Attayn Group LLC / yan@attayn.com. Toast emails the application
form link to that inbox. Below: paste-ready answers for the usual questions;
tune to the actual form when it arrives.

## Company
- **Legal entity:** Attayn Group LLC (product: QDXone, https://qdx.one)
- **Contact:** Yan Tsirklin, Founder — yan@attayn.com
- **Product stage:** live in production with paying-pilot restaurant customers
  (multi-tenant SaaS; web + iOS/Android operator apps)

## Integration name
QDXone — hiring & screening for restaurants (new-hire push to Toast)

## Category
Team management / HR & labor (employee onboarding)

## What QDXone does (product description)
QDXone is an inbound hiring platform built for quick-service restaurants.
Operators post jobs and share a store QR/link; applicants apply from their
phone and complete a short structured assessment; QDXone scores every
applicant and gives the operator a ranked, explainable shortlist plus
interview scheduling and hiring decisions — on web and a native mobile app.
We score rather than filter: every applicant gets assessed, and the operator
sees fit at a glance.

## Proposed integration (what we'll build with the Toast API)
When an operator marks a candidate **hired** in QDXone, we create that person
as an employee in the operator's Toast location so managers never re-type new
hires into the POS back office:

1. Operator connects QDXone to Toast via Toast Partner Connect and picks
   locations (we read granted locations via the partner access API).
2. One-time mapping of QDXone roles → Toast jobs (`GET /labor/v1/jobs`).
3. On hire: `POST /labor/v1/employees` at the hired-at location with
   first/last name, email, our candidate id as `externalEmployeeId`, and the
   mapped `jobReferences`. Duplicate-email 400s surface to the operator as
   "already in Toast." Every write is audited; failures are visible and
   retryable (durable outbox, no fire-and-forget).
4. Periodic read-back of `/employees` for reconciliation only.

Wages and passcodes intentionally stay in Toast (job defaults / manager-set).
No order, payment, menu, or guest data is requested.

## APIs & scopes requested
- `labor.employees:write` — create/update employees on hire (the integration)
- `labor.employees:read`, `labor:read` — jobs list for mapping; reconciliation

## Data flow / privacy
We push employer-authorized new-hire identity data (name, email, external id,
job) INTO Toast at the employer's instruction; we read only jobs + employee
records we manage. SOC2-aligned practices: per-tenant isolation with RLS,
secrets in platform vaults, TLS everywhere, audit trail on every write.
[Adjust if the form asks for formal certifications — we have no SOC2 report;
say "in progress" only if true.]

## Customer demand (the priority lever)
- **16 Handles New City — Toast merchant (confirmed 2026-07-14)** — live
  QDXone pilot since June 2026; 1,200+ applicants assessed. Contact available
  on request. [Give them a heads-up before submitting so a Toast outreach
  isn't a surprise; even better if they mention the ask to their Toast rep.]
- Target segment is Toast's core: single- and multi-location QSR/fast-casual
  operators; every QDXone customer conversation raises "does it push to my
  POS" — Toast is the #1 requested system.

## Volume estimate
Very low API load: a handful of employee creates per location per month
(hiring events), one jobs read per mapping session, low-frequency
reconciliation reads. No polling loops against orders or high-volume APIs.

## Sandbox / timeline
Ready to build immediately on sandbox credentials; integration is scoped
(docs/toast-hire-push-scoping.md) and reuses production-proven outbox/cron
infrastructure. Realistic build-to-certification: 2–4 weeks from credentials.

## Also ask in the application / discovery call
Whether a **restaurant-management-group API account** with
`labor.employees:write` could serve our named pilot merchant while the full
partnership completes review — we're happy to start restricted to their
locations.
