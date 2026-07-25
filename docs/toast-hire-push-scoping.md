# Toast POS — "Push new hires" scoping

**Goal:** when an operator marks a candidate **hired** in QDXone, the person
shows up as an employee in their Toast POS (name, email, job) — no retyping in
Toast's back office. First item on the integrations roadmap
(docs/pricing-strategy-v1.md; an Operator-tier differentiator).

---

## What Toast's platform actually allows (verified July 2026)

**The right API exists.** `POST /labor/v1/employees` creates an employee at a
location; `PATCH` updates/soft-deletes; jobs come from `GET /labor/v1/jobs`.
Required fields: `entityType: "RestaurantUser"`, unique `email`, `firstName`,
`lastName`; optional `externalEmployeeId`/`externalId` (our candidate id),
`passcode`, `jobReferences` (Toast job GUIDs). Every call is scoped to one
location via the `Toast-Restaurant-External-ID` header — multi-location =
one call per location, and employee GUIDs are per-location (no shared
identity). Names reject `{}<>$=\;%`.

**The gate: write access is partner-only.**
- **Standard API access** (what any restaurant can request for itself) is
  **read-only** — the scope list has `labor.employees:read` and no write
  scopes at all.
- Employee **write** (`labor.employees:write`) requires a **Toast partner API
  account** via the integration-partner program: application → discovery call
  → Toast compliance/privacy/security/legal approval + signed partner
  agreement → sandbox credentials → build → **certification call** → beta.
  Toast says applications are volume-backlogged and **prioritized by customer
  demand** — they explicitly ask for named mutual customers.
- Once partnered, restaurants enable us themselves in **Toast Partner
  Connect** (their back office), and we discover granted locations via the
  partner location-access API.

**Certification expectations for employee integrations** (from Toast's own
checklist): keep an audit trail of why each employee change happened, prevent
concurrent updates to the same employee, sync back from `/employees`
periodically (changes made inside Toast), don't delete clocked-in employees,
passcodes 1–8 digits unique per location.

## Recommendation — two phases, apply now

### Phase 0 (this week): file the partner application
The application is cheap and the queue is demand-prioritized, so the clock
only starts when we file. Cite 16 Handles New City as the requesting mutual
customer (confirm they're on Toast + willing to be named). In the application,
also ask whether a **restaurant-management-group API account** (their
"internal/contracted developer" model) could carry `labor.employees:write` for
the pilot org — if yes, that's a fast lane to a working pilot while the full
partnership grinds through legal/certification.

### Phase 1 (ship now, no API): the "Toast hire packet"
On **hired**, offer the operator a one-tap handoff formatted exactly like
Toast's Add Employee screen: first/last name, email, phone, suggested job —
copy button + optional email to the manager, with a link to Toast's
back-office employee page. Zero dependency on Toast, ~half a day of work,
kills most of the double-entry pain, and every use is demand evidence for the
partner application. (We already emit a `hired` notify event server-side —
this hangs off the same hook.)

### Phase 2 (once credentials arrive): the real push
Reuses patterns we already run in production:

1. **Connection & mapping settings (org → Toast):** store per-location Toast
   restaurant GUIDs (from the partner location-access API after the operator
   enables QDXone in Partner Connect). Map QDX roles → Toast job GUIDs
   (dropdown fed by `GET /labor/v1/jobs`); per-location mapping.
2. **Push on hire via outbox:** hired event writes an outbox row; the existing
   worker cron (same pattern as the scheduling outbox) drains it: create or
   match employee (`externalEmployeeId` = QDX candidate id; on duplicate-email
   400, surface "already in Toast" and offer PATCH-link instead), attach
   `jobReferences`, store the returned per-location `toast_employee_guid`.
3. **Operator-visible status + retry:** "Pushed to Toast ✓ / failed — retry"
   on the candidate; never silent. Audit rows for every write (certification
   requirement anyway).
4. **Deliberately out of scope v1:** wages (job defaults apply; overrides stay
   in Toast), passcodes (POS access is sensitive — let the manager set it),
   scheduling, sync-back beyond duplicate detection.

Build estimate for Phase 2: ~1–2 weeks (settings UI + mapping, outbox worker,
error/status surfacing, audit), then Toast's certification call gates go-live.

## Product/positioning notes
- **Tier:** Operator ($79) feature per the pricing strategy — integrations are
  the paid differentiator; Phase 1 packet could be all-tiers as a teaser.
- **Privacy:** we transmit the hire's PII (name/email/phone) to Toast on the
  employer's instruction — add Toast to the processor/recipient disclosure
  when this ships (same bucket as the counsel-review pass).
- **Not worth it:** piggybacking on scheduler partners (7shifts et al.) that
  already sync employees into Toast — adds a vendor between us and the POS
  and undercuts our own integration story.

## Open questions (Yan)
1. Is 16 Handles New City on Toast, and will they let us name them in the
   application? (Biggest lever on queue priority.)
2. Phase 1 packet: copy-block in the hired flow, email to a manager address,
   or both?
3. Multi-location orgs: hire pushes to the hired-at location only (my
   assumption), or offer a location picker?

## Sources
- Adding an employee: https://doc.toasttab.com/doc/devguide/apiAddingAnEmployee.html
- Standard API access scopes (read-only): https://doc.toasttab.com/doc/devguide/devApiAccessScopes.html
- Employee-integration checklist: https://doc.toasttab.com/doc/cookbook/apiIntegrationChecklistEmployee.html
- Partner process: https://doc.toasttab.com/doc/devguide/integrationDevProcess.html
- API account types: https://doc.toasttab.com/doc/devguide/apiClientAccounts.html
- Partner application: https://pos.toasttab.com/partners/integration-partner-application
