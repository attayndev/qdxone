# Assessment Validation & Instrument Refinement — Spec (v2, red-teamed)

**Status:** Rewritten 2026-07-31 after a 4-lens adversarial red-team (psychometrics,
employment-law/EEOC, data-engineering, product-scope). v1 scored 3–6/10 across lenses;
this v2 addresses every finding. Score log in §12.
**Owner decision (Yan):** Path A — insight/validation only. The instrument NEVER
becomes a candidate-facing score, rank, or auto-filter. Positioning: [[brand_positioning]].

---

## 0. Thesis (one paragraph, and it changed after the red-team)
We are **not** going to "train a model on n≈10 to discover the right traits" — that
would produce confident noise and, if it reweighted the instrument, would make it
*harder* to defend, not easier. Instead: **the instrument's primary validity claim
rests on validity generalization (VG) — decades of meta-analytic evidence that
conscientiousness / agreeableness / emotional-stability predict service-role
performance and turnover (Barrick & Mount; Ones et al.; Schmidt & Hunter) — plus a
documented job analysis linking our facets to QSR job requirements.** That is a
validity argument the Uniform Guidelines (UGESP §1607.7, §1607.14D) explicitly
recognize *without* a local criterion study, and it is far stronger today than
anything our data can produce. Local outcome data is used **only** for (a) instrument
*reliability* (computable now, no outcomes needed), (b) *adverse-impact monitoring* of
the instrument as used today (a live legal duty, not R&D), and (c) *directional,
clearly-preliminary* criterion checks that will not touch the live instrument for a
long time. This spec is therefore small now, honest about n, and records the rigorous
future design without building it prematurely.

## 1. Two things that are true today (the reframe)
- **(A) The live instrument is ALREADY a UGESP-covered "selection procedure."** It's
  used as a basis for hiring decisions (human-mediated counts — UGESP §1607.4B), so
  its obligations attach *now*, independent of this project. "Internal-only / never
  auto-decides" defers liability for *new* harm this pipeline might create; it does
  **not** defer the duty to monitor the current instrument for disparate impact.
  → Decouple two questions that v1 conflated: **"is the instrument, as used today,
  causing adverse impact?"** (answer NOW — §4b) vs. **"is it safe to CHANGE the
  instrument?"** (gated at large, power-derived n — §9).
- **(B) Usable criterion n ≈ 10** (assessed AND reviewed employees; 70 complete
  assessments, 28 ratings across ~10 people). Local criterion-related validity is
  years away. Everything outcome-linked is directional-only until §9's gates clear.

## 2. Goals / non-goals
**Goals:** (1) State + document the VG + job-analysis validity basis. (2) Compute
**instrument reliability** now. (3) Run **continuous adverse-impact monitoring** of the
live instrument, LL144-audit-formatted. (4) Surface existing directional criterion
analytics with honest n + suppression, internal-only. (5) Record the rigorous
future criterion-study + engineering design so it's ready when n justifies it.
**Non-goals:** ❌ candidate-facing score/rank/filter ever. ❌ LLM/Qwen trained to
score. ❌ any automated or near-term change to live scoring. ❌ building the
cross-tenant pipeline / Python stats service now (§7 is design-only). ❌ per-customer
"who to hire" analytics (Path B, rejected).

## 3. Scope & the opportunity-cost cap (product red-team)
Most of v1 was infrastructure for a study 10–20× the current data. **De-scoped from
"now":** the Python job, the snapshot store, cross-org de-identification, item
pruning, composite reweighting, role-specific profiles, CV machinery — all deferred to
§7 (design recorded, not built). **The binding lever on n is not engineering — it's
more pilots and more hires** (sales/onboarding). Therefore: **validation build effort
this quarter is capped at ≈2–3 days**, reusing what already exists
(`bucketPerformanceByFit/Dimension`, `eeo-reporting.ts` MIN_CELL=5, the `/super`
console + `platform_admins` gate, the pure `scoreAssessment`). The trigger to build the
§7 pipeline: a second pilot org signs, **or** usable n clears ~50.

## 4. NEAR-TERM BUILD (days, TS/Node, single-tenant, no new infra)
All in-repo (no second language — per the house rule against a separate backend
plane), single-tenant (16 Handles is the only pilot; nothing to pool yet), rendered
only on the platform-admin `/super` surface.

**4a. Instrument reliability — ships first, needs ZERO outcome data.**
On the 70 complete sessions: per-facet internal consistency (Cronbach's α / McDonald's
ω), item-total correlations, reverse-keying sanity. Reuse `scoreAssessment`'s
facet/keying metadata; compute in TS. *Why first:* if a facet's α < .70, unreliability
alone explains weak/unstable validity — no outcome correction matters until this is
known. This is the highest-certainty deliverable available today.

**4b. Continuous adverse-impact monitoring of the CURRENT instrument — a live duty.**
Extend `eeo-reporting.ts` (already does suppressed 4/5ths at MIN_CELL=5) to monitor
score-tier pass-rates by protected class **and pair the 4/5ths impact ratio with a
statistical-significance test** (4/5ths alone is unreliable at small n — EEOC/courts
expect both). Produce an **LL144-formatted bias-audit artifact** (impact ratios by
required categories + sample sizes + publishable summary) — the org already committed
to this posture publicly (`docs/site-strengthening/appendix-a-counsel-io-review.md`;
`/enterprise` promises "4/5ths monitoring built in"). This is **not gated** behind the
§9 change-thresholds — it runs now on the current instrument.

**4c. Surface existing directional criterion analytics — clearly PRELIMINARY.**
`bucketPerformanceByFit` / `bucketPerformanceByDimension` already compute band-vs-
rating/retention. Add three things and drop one card on `/super`: **n per cell**,
**MIN_CELL≥5 small-cell suppression** (re-identification control — §8), and a hard-coded
**"PRELIMINARY — n far below actionable; directional only"** badge. Show the
n-growth-over-time readout so we can *see* whether we're approaching §9 territory. No
CV numbers, no reweighting, no item analysis (§7 explains why those are unsafe now).

**4d. Document the validity basis — the linchpin of §0, and it needs NO outcome data.**
§0's whole thesis is "VG + a documented job analysis." That document must actually
*exist* — asserting it isn't the same as having it, and under UGESP §1607.14D a VG
argument is only as strong as (a) a written **job analysis** linking each measured facet
to concrete QSR job requirements, and (b) a **citation table** of the meta-analytic
evidence (Barrick & Mount; Ones et al.; Schmidt & Hunter; service-role specifics) with
the effect sizes claimed. Both are producible **now**, need zero criterion data, and are
the strongest validity artifacts the org will have for years. Draft them with (and have
them signed by) the I/O psychologist (§10 Q1). Until they exist, "validated/established"
claims rest on nothing documentable — which is also why §8's live-copy fix matters.

## 5. Data model & the criterion problem
**Join:** `employee` → `application_id` → `assessment_sessions`
(`methodology_version` is stamped immutably at session creation — verified,
`session.ts:70`) → `assessment_responses` + `item_bank_items` → `scoreAssessment`.
Compute **within `methodology_version`**; a re-assessed employee's single outcome
attaches to at most one version-row (never pooled across versions, including for
n-counts).

**Criterion contamination tiers (psychometrics red-team — v1 wrongly called all
"objective" criteria clean).** The operator sees the fit score *before* hiring and
*before* every review/HR action, so Pygmalion effects contaminate more than ratings:
| Tier | Criterion | Contamination |
|---|---|---|
| Cleanest | Attendance-triggered involuntary exit (no-call-no-show) | low |
| | Voluntary tenure / still-employed | low *but deficient* (QSR turnover ≈ wage/commute/schedule, largely construct-irrelevant) |
| | Promotion; involuntary exit "for cause" | **medium — score-aware manager decides** (not clean) |
| Dirtiest | Per-dimension review ratings (1–5) | high — halo + single-rater + score-primed |
Prioritize the cleanest tiers; put a contamination caveat on every rating-based stat;
roadmap a **blind-review mode** (reviewer doesn't see the score) to collect
uncontaminated criterion data — the single biggest long-term quality lever.

**Proxy / predictor separation is a SCHEMA boundary, not a comment (legal red-team).**
`postal_code`, `availability`, `entry_source`, `hourly_wage` are needed for
adverse-impact checks but must be **physically unreachable** by any item/facet-analysis
code path (separate table / separate access path), so a facially-neutral reweighting
can never silently key on a redlining proxy (Illinois 2026 explicitly regulates ZIP as
an employment-AI proxy).

## 6. Where Qwen actually fits (phase 3, optional, narrow)
Not a scorer. The *unstructured* signal we ignore today — `employee_reviews.notes`,
`applications.custom_answers` — via theme/sentiment extraction to create structured
features that feed the study, and to draft plain-language "what we learned" summaries.
Runs as inference (Qwen on Workers AI, or the existing Anthropic key), swappable. Never
gates a candidate.

## 7. FUTURE ENGINEERING & METHOD DESIGN — RECORDED, **NOT** CURRENT SCOPE
Build only when §3's trigger fires. Captured so the rigor isn't lost.

**7a. Execution environment (data-eng red-team — v1 named "Python" with no runtime).**
There is zero Python in this Node/Cloudflare stack. When built: a **GitHub Action**
(venv: pandas/statsmodels/lifelines) for the weekly cadence, OR a second Cloudflare
Container (`python:3.12-slim` DO, Worker-cron → `container.fetch` + bearer secret,
matching the existing scheduling-drain pattern). **Scoring stays in Node** (reuse
`scoreAssessment`; hand stats only a de-identified numeric matrix — avoids the
TS↔Python drift that burned kywrd). DB auth = a **scoped `validation_reader`
role (SELECT-only)**, never the blanket service-role key.

**7b. De-identification is done IN Postgres, and it's honestly *pseudonymization*.**
A `SECURITY DEFINER` `validation_export_v1` view does bucketing/hashing/dropping in
SQL (salt via `current_setting`, not an app env var); raw PII never crosses the wire.
**At n≈10 true anonymization is impossible** — the reverse map *is* the primary DB — so
the real control is **access (existing `platform_admins` gate) + audit logging + k≥5
cell suppression**, and we call it "pseudonymized, access-restricted, confidential,"
never "de-identified/no-PII" (that framing would fail CCPA/CPRA scrutiny).

**7c. Reproducibility = frozen row-level snapshots, not a "no-wall-clock" note.** Source
rows mutate. Insert-only tables (revoke UPDATE/DELETE):
`validation_snapshots(id, snapshot_at, code_version, methodology_version, row_count,
per_version_n jsonb, status)` and `validation_snapshot_rows(snapshot_id fk,
employee_pseudonym, methodology_version, predictors jsonb, criteria jsonb, covariates
jsonb, quality_flags jsonb)`. Stats become pure functions over a frozen table.

**7d. Anti-p-hacking is a MECHANISM, not a norm.** `validation_hypotheses`
(pre-registered before looking) + `validation_test_log` (every test ever run, for
across-time family-wise error). Split outputs: **confirmatory** (pre-registered,
§9-eligible) vs **exploratory** (dashboard-only, always PRELIMINARY, never gate-eligible
regardless of p). Suppress reweighting/item-analysis outputs entirely below an n floor.

**7e. The analyses & their psychometric guardrails.**
- **Per-analysis power-derived n thresholds** (v1's flat n≥100 was made up): correlation
  (n≈85 for r=.30, ≈193 for r=.20), OLS composite, **logistic retention with ≥10–15
  events-per-predictor**, Cox survival for censoring, subgroup splits — each its own
  floor, computed against expected effect size and re-derived for the FDR-adjusted α.
- **No cross-validation numbers below a real held-out sample.** LOO/k-fold at n≈10 is
  theater (folds share ~9/10 of data; one outlier flips the sign). Report only
  directional agreement, labeled "no evidentiary value."
- **Reweighting = a validity-strategy change with LEGAL consequences.** Free regression
  weights convert a construct-keyed instrument into a criterion-keyed one — *less*
  defensible in an adverse-impact challenge and unstable at small n. If ever proposed:
  **regularized shrinkage toward the current unit weights only**, with an I/O-psych
  **construct-validity** justification (not just a fit stat), and expect the unit-weight
  hand-rule to *win* (Dawes 1979) — that's the acceptable outcome, not a null to explain.
- **Item pruning moratorium:** no prune/keep decision even *proposed* below a
  power-derived item-level n (likely several hundred), and **replication in a
  non-overlapping sample** required before any item is retired.
- **Range restriction:** name the mechanism first — selection here is (largely) *direct*
  on the fit score, so the **direct/Case-I** correction, not Thorndike Case II; the
  "unrestricted" variance is itself funnel-restricted (correct conservatively); and
  **propagate the corrected estimate's CI** (bootstrap), never report a bare corrected r.
- **Add:** utility analysis (Taylor-Russell / Brogden-Cronbach-Gleser — translate r into
  "bad hires prevented" at the real selection ratio); **regression-to-mean guard** on
  review trajectories (≥2 reviews + minimum gap; condition change on baseline); **MNAR
  second selection stage** (who *gets reviewed* is itself non-random — diagnose reviewed
  vs unreviewed on observed scores); and **incremental validity over the operator's
  holistic judgment** (the commercially important question v1 never asked).

## 8. Governance, legal & ethics (employment-law red-team)
- **UGESP framing** (§1): this study *is* the §1607.14B criterion-validity effort with
  §1607.15 documentation duties + the §1607.14B(2) bias-review duty; treat it as the
  compliance answer, not a toy.
- **Rater-bias check** (distinct from contamination): do review ratings differ by
  protected class *after* controlling for objective proxies (attendance/incidents)?
  Manager ratings carry documented race/gender bias independent of score-priming;
  reweighting toward them would import it.
- **Two fairness analyses, not one — different tests, different n-floors.** (i)
  *Adverse impact on scores* (4/5ths + significance on pass-rates by group) is feasible
  sooner — it needs no outcome linkage, just the 70-session pool + `eeo.responses` — and
  is the §4b live-monitoring duty. (ii) *Differential prediction / validity* (Cleary
  model — do the assessment→outcome slope/intercept differ by subgroup?) is a **separate**
  analysis requiring adequate n *per subgroup*; at total n≈10 it is **not analyzable and
  won't be for a long time**. Until then, rely on VG evidence (personality predictors are
  well-studied for subgroup slope-invariance). Do not let (i) stand in for (ii).
- **Adverse impact in the §9 gate:** 4/5ths **AND** significance test on any proposed
  reweighted composite's classification rate by group — a *named precondition*, reusing
  `eeo-reporting.ts`.
- **Cross-tenant pooling** needs more than a B2B DPA: (i) **antitrust counsel** — pooling
  `hourly_wage` across *competing* QSR employers via a common intermediary is the
  hub-and-spoke pattern DOJ/FTC pursue (RealPage analogue); **strip wage from any pooled
  cross-tenant output**. (ii) **Individual-facing purpose-limitation notice** (CPRA/CCPA
  cover applicant + HR data) — `privacy/page.tsx` has *no* language covering
  cross-employer instrument-refinement use; add it before pooling. (iii) Single-tenant
  internal analysis of our own pilot proceeds now; pooling is gated on both counsel + notice.
- **Two consent gaps:** employees never consented to "your review data reshapes a hiring
  instrument used on other applicants" (secondary purpose — needs employee notice);
  candidates have no notice the instrument is periodically research-refined (add general,
  non-technical language).
- **LL144 / state AEDT:** cross-reference `appendix-a-counsel-io-review.md`; make the
  LL144-formatted bias-audit artifact a **named §4b deliverable**; confirm whether any
  current/prospective customer has NYC / Illinois / Colorado locations (that sets urgency).
- **Claims gating + a LIVE fix:** `ApexLanding.tsx:288` currently ships *"built on
  **validated** personality and motivation research"* — an unsubstantiated FTC-§5 claim
  the org's own review already drafted a fix for ("established"). **Land that copy change
  same-day** (independent of this spec), and add a rule: no customer-facing "validated"
  language until §9's thresholds are met for the specific claim, with a named accountable
  owner (marketing/legal).
- **I/O psychologist in the loop** signs the methodology + any instrument change — the
  thing that makes "validated" (once earned) defensible rather than marketing.

## 9. Decision gates — when a finding may touch the LIVE instrument
A change may be *proposed* to the I/O psychologist only when ALL hold, **per analysis
type**: within one `methodology_version`; **n meets the power/EPV-derived floor for that
specific test** (§7e), not a flat number; effect is **confirmatory** (pre-registered,
§7d) and survives FDR; robust to the named range-restriction correction *with widened
CI* and the contamination check; corroborated by a cleaner-tier criterion; and passes
the **4/5ths + significance** adverse-impact precondition (§8). Shipping = a **new
`methodology_version`** with written I/O + construct-validity sign-off; prior data is
never silently re-scored.

## 10. Open questions (v1's were stale — corrected)
Resolved: EEO table = `eeo.responses` (migration 0003) with `eeo.ts`/`eeo-reporting.ts`
(MIN_CELL=5); `/super` + `platform_admins` exist; `methodology_version` stamped at
create. **Still open:** (1) Is an I/O psychologist retained to sign methodology? (§9 +
the "validated" claim depend on it.) (2) Will we build **blind-review mode** for clean
criterion data? (3) **Antitrust counsel** before any cross-tenant pooling. (4)
Operator-meaningful **"bad exit" definition** (involuntary / <90-day / NCNS). (5) Any
customer in **NYC/IL/CO** (sets LL144/AEDT urgency)? (6) ToS/DPA **and** individual-notice
language for cross-tenant + research reuse.

## 11. Success criteria (near-term, §4)
- 4a reliability (α/ω + item-total) computed on the 70 sessions, in TS, on `/super` — no
  outcome data touched.
- 4b live-instrument adverse-impact monitor (4/5ths + significance, MIN_CELL≥5) + an
  LL144-formatted artifact — running continuously, not gated.
- 4c existing bucket analytics surfaced with n + suppression + PRELIMINARY badge +
  n-growth readout; zero customer-facing surface touched; no CV/reweighting/item output.
- The "validated"→"established" copy fix is landed.
- No code or UI path exists from any of this to a candidate-facing score.

## 12. Red-team score log
v1 lens scores: product 3, psychometrics 4, legal 5, data-eng 6. v2 changes: VG as
primary validity basis (psy #7); Phase-0 reliability that needs no outcomes (psy #8);
de-scoped to a ≈2–3-day single-tenant build reusing existing code + explicit
opportunity-cost cap (product #1–7); UGESP "already-covered" reframe + live-instrument
monitoring decoupled from change-gates (legal #1); rater-bias check, schema-enforced
proxy boundary, antitrust + wage-strip + individual notice, LL144 artifact, and the live
"validated" fix (legal #2–8); Node-scoring + Postgres-view pseudonymization + scoped role
+ frozen insert-only snapshots + pre-registration/test-log + named runtime (data-eng
#1–8); per-analysis power thresholds, no-CV-below-held-out, reweighting-as-construct-
preserving, item-pruning moratorium, utility/RTM/MNAR/incremental-validity, contamination
tiers (psy #1–6, 9–14). Open items are now genuine external dependencies (counsel, an
I/O hire, a 2nd pilot), not unresolved design.
