# Per-Category Performance Reviews + Dimension-Level Analytics — Spec v1

**Status:** approved (2026-07-26)
**Goal:** Rate employees on the **same four dimensions the assessment measures**,
so performance can be validated against the assessment *dimension by dimension* —
not just "did high scorers do better overall," but "does the assessment's
*Reliability* score predict on-the-job *reliability*?"

## The four dimensions (assessment ↔ review, one language)
| assessment category (academic) | operator label | review column |
|---|---|---|
| Conscientiousness | **Reliability & Drive** | `rating_conscientiousness` |
| Agreeableness | **People Skills** | `rating_agreeableness` |
| Emotional Stability | **Composure** | `rating_emotional_stability` |
| Self-Direction | **Ownership** | `rating_self_direction` |

A single canonical list (`REVIEW_CATEGORIES`) drives the UI, the action, the
analytics, and the demo seed — add/rename in one place.

## Review form: 5 dropdowns
Four category ratings **+ an explicit overall** (the manager's own call, not
auto-derived — per Yan). All on the same 1–5 scale with the existing labels
(1 Not meeting → 5 Outstanding).
- **Overall** is required when "still employed" (unchanged from today).
- **The four category ratings are optional** (blank = "not rated") — respects the
  low-friction UI principle; the analytics fills in wherever they're rated.

## Schema (migration 0024) — backward compatible
`employee_reviews` gains four nullable columns (`rating_conscientiousness`,
`rating_agreeableness`, `rating_emotional_stability`, `rating_self_direction`,
each `int check between 1 and 5`). The existing `rating` column stays as the
**overall**. Yesterday's single-rating reviews remain valid (categories null).

## Analytics: per-dimension prediction
Reports gets, for **each** of the four dimensions, a mini-breakdown: bucket hires
by their **assessment band on that dimension** (Low / Mid / High) and show the
**average on-the-job rating on that same dimension** (+ n). The story to see:
High-band employees rate higher on the job for that dimension.
- Needs per-category assessment bands per application. Add `scoreByApplication`
  (shared core reused by `fitByApplication` — single source of truth) exposing
  each app's `{ overall, categories[{academic, band}] }`.
- Same honesty rules as the overall view: sample sizes shown; a band with < 3
  rated employees is "too few to read yet"; clean empty state.
- Keep the existing overall "performance by fit" section; add the per-dimension
  section beneath it.

## Demo seed
Generate all five ratings per review, each category rating correlated to that
candidate's **per-category assessment band** (High→4–5, Mid→3–4, Low→2–3), and
the overall correlated to overall fit — so the demo shows a believable
dimension-by-dimension relationship.

## Build order (migration-first, verified on dev, one deploy)
1. Migration `0024_review_category_ratings.sql` + regen types + PostgREST reload.
2. `REVIEW_CATEGORIES` canonical list + review types (employees.ts / core).
3. `scoreByApplication` shared helper; `fitByApplication` refactored onto it;
   `categoryBandsByApplication`.
4. `addReview` action: read + store the 5 ratings.
5. Review UI: 5 dropdowns; detail history shows category ratings.
6. Analytics: per-dimension bucketing (pure, unit-tested) + Reports section.
7. Demo seed: 5 correlated ratings.
8. Verify on dev (review save with categories; per-dimension analytics render;
   demo reseed), then deploy once **together with the held demo-reset cron**.
