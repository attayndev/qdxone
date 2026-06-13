# QDX One — Skills Assessment & Auto Follow-Up
**Build Spec (from design thread)**

This spec covers a new layer on top of the existing QDX One platform: a **skills
assessment bank** and an **automatic follow-up workflow** that sends it after the
core personality assessment. It also captures the compliance rules that constrain
how this gets built. Anything not described here (the four personality constructs,
verbal banding, three-tier norming, Module H incumbent benchmarking) is unchanged
and shared.

---

## 1. Core architecture decisions

- **One scoring core, two assessment types.** The skills assessment shares the same
  backend engine as the personality assessment but is a distinct *type* with its own
  scoring model. Do **not** fork the engine.
- **Separate item banks.** The personality item bank (~83 items) and the skills bank
  are different banks with different governance. They validate by different legal
  mechanisms (criterion validity vs. content validity) and must not be mixed.
- **Skills are role-indexed.** Each skill module attaches to a specific job posting /
  role (cashier ≠ cook ≠ drive-thru ≠ assistant manager). Content validity is
  role-specific and cannot be reused across roles without re-justification.
- **Skills scored as proficiency, not personality bands.** Output is a
  proficiency/threshold result, not Low/Mid/High trait bands. Different output,
  different storage.
- **Score-not-filter still holds.** The platform informs; operators decide. (See §6 —
  do not treat this as a full exemption from AEDT obligations.)

---

## 2. Candidate workflow (the state machine)

1. Candidate completes the **core personality assessment** (stage 1).
2. On completion, the system **automatically sends the skills assessment link**
   (stage 2) as a follow-up:
   - **All tiers:** email.
   - **Higher tiers:** email **+ SMS** (SMS requires consent — see §5).
3. Candidate completes the skills assessment **asynchronously, when ready** (separate
   session, mobile-friendly).
4. **Automated reminders** nudge stage-2 completion (also a sellable completion-rate
   feature).

### 🔒 Non-negotiable build rule
The follow-up link must be sent to **everyone who completes stage 1 — never
conditionally on their personality score.**
- Universal send = a workflow step = legally inert.
- Conditional send (only to candidates above a personality threshold) = an
  **automated screen** the system makes based on a score = exactly what NYC LL144 /
  CA FEHA regulate. Do not build the conditional version, and do not let it get
  "optimized" in later ("why bother low scorers?").

### Operator visibility
A candidate who hasn't done stage 2 yet must surface to the operator as
**"stage 1 complete, skills pending"** (or "declined"), never disappear. Otherwise
differential stage-2 drop-off silently becomes a filter no one designed.

---

## 3. Skills bank design

- **Basic vs. advanced = crew vs. management roles**, not test difficulty.
  - *Basic / crew:* cashier competency (making change, transaction accuracy, POS
    scenarios), food handler, etc. **Note: this is not a timed-math test** — it's an
    untimed, applied competency check, which keeps adverse-impact exposure low.
  - *Advanced / management:* inventory control, scheduling, labor/food cost, cash
    reconciliation — attached to shift-lead / assistant-manager / GM postings.
- **Entry-vs-trained gate for advanced modules.** A skill is only content-valid to
  screen on if the candidate is expected to do it **at entry** for that role. If it's
  trained post-hire/post-promotion, don't test for it pre-hire. Each advanced module
  needs this check before it ships (scheduling on an AM posting = fine; scheduling on
  a crew posting = not).
- **Content-validity record per role.** Maintain a paper trail showing each module's
  items sample the actual job tasks. This is the strongest legal asset in the whole
  platform — keep it documented.

---

## 4. Pricing & tiering

Fence on **role-tier (crew vs. management) and breadth/compliance depth — never on the
legal-safety floor.** Every tier must include a content-valid instrument; don't paywall
defensibility, or small operators run the riskier personality-only screen.

Suggested good-better-best:

| Tier | Includes |
|------|----------|
| **Base** | Personality core + 1–2 starter crew skill modules (e.g. cashier) + verbal bands + email follow-up |
| **Mid** | Full crew skills library + SMS follow-up + adverse-impact dashboard + incumbent benchmarking |
| **Top** | Custom + management/advanced modules + Tier 2/3 norming + audit-ready compliance exports + multi-location/multi-role |

- **Management/advanced modules: price per-assessment (high unit, low volume).** A
  franchisee screens ~200 cashiers but ~3 GMs/year, and a bad GM hire is costly — high
  willingness-to-pay per screen. Crew skills fit flat/volume pricing.
- Compliance depth (adverse-impact analytics, audit exports, Tier 2/3 norming) is the
  natural enterprise axis — it scales with operator size and multistate exposure.

---

## 5. SMS consent (TCPA) — for the higher-tier text feature

These are **informational/transactional** texts (assessment links, application status),
**not marketing** → **prior express consent** suffices and a checkbox is a valid
mechanism. No marketing-grade written-consent apparatus needed.

**Checkbox:** "Can we send you text messages regarding this application?"

Build requirements:
- **Unchecked by default and optional.** Candidate must be able to submit the
  application without checking it. No pre-checked box; do not condition the application
  on consent. *(Most likely thing to invalidate consent — get this exact.)*
- **Operative terms inline at the checkbox**, not hidden in the hover: *we'll text you
  about this application · Msg & data rates may apply · reply STOP to opt out.* Hover/?
  icon is fine for extra reassurance ("contact only regarding this application"), but
  the material terms must be conspicuous.
- **Opt-out in messages:** every SMS includes "Reply STOP to opt out, HELP for help."
- **Timestamped consent record:** store the exact disclosure language version + channel
  + timestamp. This is the proof that wins a dispute. (Backend.)
- **Name the sender:** make clear who "we" is (platform vs. restaurant), since QDX texts
  on operators' behalf.
- **Scope limited to "this application":** re-contacting a candidate about a *different*
  opening needs fresh consent. Flag before any "re-contact past applicants" feature.

Statutory damages are $500–$1,500 per text, which is why the unchecked-default and
consent-record items must be exact, not approximate.

---

## 6. Adverse-impact & compliance rules (cross-cutting constraints)

- **The one live impact surface is stage-2 completion.** With universal auto-send, the
  discretionary "who advances" gate is gone. The new monitoring cut is **stage-2
  completion rate by protected group** (async drop-off can correlate with protected
  characteristics via phone/data/time access). Track it; act on gaps.
- **Continuous adverse-impact monitoring** on backend numeric scores (4/5ths rule),
  tracked **separately** for the skills module vs. personality.
- **Score-not-filter helps but is not a full AEDT exemption** — "substantially assist"
  still counts. Build for the obligations as if they apply.
- **AEDT laws in scope** (verify specifics with counsel before launch):
  - *NYC LL144* — annual independent bias audit + candidate notice; triggered by
    candidate location, not HQ.
  - *CA FEHA ADS regs* (eff. Oct 1, 2025) — explicitly covers tools that give tests.
  - *Illinois HB 3773* (eff. Jan 1, 2026) — notice when AI used in hiring.
  - *Colorado SB 26-189* (eff. Jan 1, 2027) — disclosure + human-review pathway.
- **Incumbent benchmarking = validation, not profile-cloning.** Use incumbents to
  validate against *objective* outcomes (tenure, attendance, productivity, de-biased
  ratings), not as a "looks like our current team" target. Keep bias-replication
  safeguards.
- **ADA:** skills tests raise **reasonable-accommodation** obligations (timed/reading
  elements) — keep applied skills untimed where possible. Personality **Composure**
  items must stay behaviorally framed to avoid medical-exam characterization.

---

## 7. Data model — entities this implies

- **SkillModule** — role-indexed; difficulty/role-tier (crew/management); entry-vs-trained
  flag; content-validity record reference.
- **AssessmentSession** — links candidate ↔ posting; stage-1 status; stage-2 status
  (pending / complete / declined); timestamps.
- **ConsentRecord** — channel (SMS); disclosure language version; sender identity;
  timestamp; opt-out status.
- **AdverseImpactLog** — events for stage-2 send, completion, and operator advancement,
  taggable by protected group for aggregate analysis (individual EEO data stays
  aggregate-only, per existing platform rules).
- **TierEntitlement** — which skill modules / channels (SMS) / compliance features a
  given operator's tier unlocks.

---

## 8. Suggested build sequence

1. Extend scoring core to support a second assessment type (skills) with proficiency
   scoring sharing the engine.
2. Skills bank data model + first starter cashier module (content-validity record
   included).
3. Two-stage candidate workflow + **universal** auto follow-up trigger.
4. TCPA consent capture (checkbox + ConsentRecord) — gate SMS behind it.
5. Multi-channel send (email all tiers; SMS higher tiers) + automated reminders.
6. Stage-tracking + operator "pending/declined" visibility.
7. Adverse-impact monitoring (stage-2 completion cut + skills-module impact).
8. Tier/feature gating + per-assessment pricing hook for management modules.

---

## 9. Open items (decide before/while building)

- Exact contents of the cashier module (task domains + item formats) — can be sketched.
- Advancement/completion-rate thresholds that should flag an operator.
- Which roles get advanced/management modules first.
- Final sender-entity wording in the consent disclosure (platform vs. operator name).
- Whether reminders are SMS+email (higher tier) or email-only by tier.

---

*Not legal advice. The AEDT bias-audit/notice mechanics and the TCPA consent specifics
should be confirmed with employment counsel before launch.*

---

## How this fits the current plan (added 2026-06-12)

**Sequencing: this is the next major epic AFTER the pricing-v1 rewrite + trial-only
beta launch — not a pre-beta insert.** Rationale:
- The beta's job is to validate the core loop (post → apply → personality assess →
  review) with real restaurants. Skills/two-stage isn't needed to get that signal,
  and it roughly doubles surface area.
- The skills layer is heavy and compliance-loaded (TCPA, AEDT bias audits,
  content-validity records) — it deserves a deliberate build with counsel, not a
  rushed pre-beta sprint.
- It *extends* existing scaffolding rather than greenfield (SMS, auto-send-assessment,
  EEO/4-5ths monitoring, assessment_sessions all already exist), so nothing is lost
  by sequencing it after beta.

**Two carve-outs that touch the current build:**
1. **TCPA SMS consent (§5) is a present-tense issue.** The current build already texts
   candidates the assessment link on application submit. For beta we either (a) make
   candidate notifications **email-only** (recommended — removes TCPA from the critical
   path), or (b) add the §5 consent checkbox + ConsentRecord now. Operator-facing SMS
   (strong-candidate alerts) is B2B and unaffected.
2. **Pricing reconciliation.** §4's Base/Mid/Top + per-assessment management pricing
   must map onto the LOCKED Solo/Operator/Enterprise v1 model as *add-ons*
   (skills modules as tier entitlements; management modules metered per-assessment) —
   it does not replace v1. Reconcile when we build skills; see
   `docs/pricing-strategy-v1.md`.
