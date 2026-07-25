# Spanish localization — scope

**Question:** what would it take to offer job postings and the assessment in
Spanish? **Short answer:** it's three separate projects wearing one label. Two
are ordinary engineering; one is a psychometric commitment. They should ship in
that order, not together.

Today the app is English-only: no i18n library, no locale column anywhere,
`<html lang="en">` hardcoded (`src/app/layout.tsx:32`). The FAQ already tells
operators "Spanish is planned."

---

## The one fact that shapes everything: scoring is text-independent

`src/lib/assessment/scoring.ts` never reads item text. It reverse-keys
(`6 − value`) and averages the 1–5 response *values* by `item_id` and `facet`;
bands are thresholds (≥4 High, ≥3 Mid). Scoring metadata is pulled by `item_id`
(`session.ts:216`). So a Spanish item that keeps the same `item_id` / `facet` /
`keying` / `category` flows through the **identical scoring engine and existing
norms with zero scoring-code change.**

That makes the *engineering* of a translated assessment cheap. It does **not**
make the *assessment* cheap — see Layer C.

---

## Three layers

### Layer A — Candidate-facing UI chrome (pure engineering, low risk)

Hardcoded English strings the candidate sees, all needing extraction:
- **Assessment runner** (`src/components/AssessmentRunner.tsx`): the 5-point
  scale labels live in a module `SCALE` array (`:160` — "Strongly disagree" …
  "Strongly agree"), plus "All done!", progress "{n} of {total}", "About 5
  minutes", "Continue"/"Finish", footer note. Scale labels are NOT stored with
  items — they're only here.
- **Attention-check prompt** hardcoded in `session.ts:96` ("Quick check — please
  choose 'Agree'…").
- **Apply page + form** (`ApplicationForm.tsx`, `app/apply/[token]/page.tsx`):
  "Your info", field labels (First name/ZIP/etc.), day/block labels (Mon…Sun,
  AM/Mid/PM), "Submit application", eligibility + availability prompts.
- **Public posting page** (`app/j/[token]/page.tsx`): "Now hiring", "How it
  works" bullets, "Start your application".
- **Gate messages** (`app/a/[token]/page.tsx:36`): already-completed / expired.
- **SMS consent disclosure** (`src/lib/consent.ts`) — versioned legal text;
  Spanish version wants the same care as the English (flag to counsel).

**Work:** add a lightweight i18n layer (a typed dictionary keyed by locale is
enough — we don't need `next-intl`'s routing machinery for a token-based
anonymous flow), extract ~80–120 strings, add a language toggle on the apply
entry + `Accept-Language` auto-detect. **~4–6 days.**

### Layer B — Operator & AI-authored content (engineering + product design)

- **Job descriptions** live in `org.branding.role_descriptions[title]` (operator
  free text). **Careers copy** is AI-drafted (`careers-copy-generate.ts`) and
  **job descriptions can be AI-drafted** (`generateRoleDescription` in
  `admin/locations/actions.ts:184`, claude-haiku). Both prompts hardcode English
  output — adding a target-language parameter is a one-line change each.
- **Custom application questions** are operator-authored labels
  (`branding.application_config.custom_questions`).

**Product decision (yours):** who produces the Spanish?
- *AI dual-generation* (recommended for AI-drafted content): generate EN + ES
  together, store both, candidate sees their language. Cheap, good quality,
  operator-editable.
- *Operator writes both* — most control, most operator effort.
- *Machine-translate operator free text at render* with a visible "automatically
  translated" tag — good fallback for the free-text description + custom
  questions an operator didn't translate.

**Work:** dual-gen prompt params + store both language variants + render by
candidate locale + a machine-translate fallback path. **~3–5 days.** No
psychometric risk — this is marketing/operational content.

### Layer C — The assessment item bank (the real project)

**Schema** (`item_bank_items`, `0003:167`): no locale column. Recommended shape —
a sibling table so English stays canonical and the shared keys never fork:

```
item_bank_item_translations(version, item_id, locale, item_text)
  PK (version, item_id, locale)   -- item_id/facet/keying/category stay in
                                  -- item_bank_items → scoring & norms unchanged
```

Same treatment for `screener_items` (question + `options.label`) and the
attention-check prompt (move it from code into data, or the i18n dict).

**Persistence:** add `locale` to `assessment_sessions` (source of truth for what
the candidate actually saw — parallels how `form_item_ids` freezes the form) and
optionally `applications.locale` (their preference). Responses need no locale —
scoring is ID-based.

**The hard part is not code — it's validity.** The site says the framework was
"reviewed by a credentialed I/O psychologist" and builds on "established
research." A naive machine translation of a validated personality item silently
breaks that: wording, idiom, and reading level shift an item's meaning, so
you'd be reusing English scoring/norms on items that no longer measure the same
thing — and doing it on the exact axis (language group) the app's own
adverse-impact monitoring is supposed to protect. That's the same discipline we
just applied to the marketing copy, applied to the science.

**Options, ranked:**
1. **Expert human translation + back-translation + I/O sign-off** (recommended).
   Translate → independent back-translate → reconcile discrepancies → the I/O
   reviewer signs off the Spanish items, recorded like the English signoff
   (`methodology_versions.io_psych_signoff_at`). Preserves the claim. Cost is
   the translation + review engagement, plus lead time — **external, not eng.**
2. **Formal measurement-invariance study** (collect Spanish response data, run
   DIF analysis to prove the Spanish items behave equivalently). Gold standard,
   needs sample size — a **post-launch** item, not a blocker.
3. **Machine translation, ship it.** Cheapest, and it undermines the validity
   claim + fairness posture. **Not recommended.**

**Work:** translations tables + migration, runner/screener render by locale,
attention-check relocation, locale persistence, an admin/QA view to proof the
Spanish items. **~5–8 days eng**, gated on the option-1 translation + I/O
review (external lead time is the real critical path).

---

## Cross-cutting decisions (yours)

- **Per-org opt-in vs always-on?** Some single-location shops may not want a
  Spanish funnel; a per-org "offer Spanish" toggle (in `branding`) is cheap and
  respectful. Default on is more inclusive.
- **Operator reporting stays English.** Bands are language-neutral; category
  names ("Reliability & Drive") are English UI — the operator reads results in
  English no matter what language the candidate took it in. No work needed;
  worth stating.
- **Fairness is a point in FAVOR.** Offering Spanish *reduces* language-based
  adverse impact — a genuine equity win, provided the translation is done right
  (option 1). Worth noting to counsel as a positive, not just a risk.

---

## Recommended phasing

**Phase 1 — Spanish apply funnel (no assessment). ~1.5–2 weeks.**
Layer A candidate chrome + Layer B job/careers/custom content, language toggle +
auto-detect, locale persisted on the application. Outcome: a Spanish-speaking
applicant can find the posting, read it, and complete the application in
Spanish. Real, shippable value with **zero psychometric risk** — the assessment
stays English for now (honest: "assessment currently in English" line at the
handoff, same as today).

**Phase 2 — Spanish assessment. ~1–1.5 weeks eng, gated on external I/O work.**
Layer C. Start the translation + I/O review engagement at the *start* of Phase 1
so its lead time runs in parallel; the engineering lands when the reviewed items
are ready.

This ordering lets Spanish speakers apply almost immediately while the
validity-sensitive part gets done properly instead of rushed — and it turns the
FAQ's "Spanish is planned" into "Spanish applications are live" within a sprint.

## Open questions for Yan
1. AI dual-generation for job/careers copy — yes? (cheapest good path for Layer B)
2. Per-org Spanish opt-in, or always-on?
3. Do you have / want to engage the I/O reviewer for the Spanish item review
   (Phase 2 critical path)? Same person who reviewed the English framework?
4. es-MX vs neutral LatAm Spanish? (US restaurant workforce → I'd default to
   neutral/es-US, reviewer can advise.)
