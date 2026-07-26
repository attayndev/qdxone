# Assessment ↔ Performance Analytics — Spec v1

**Status:** proposed (2026-07-26)
**Goal:** Answer the question the whole product rests on — *do the candidates we
scored higher actually perform better and stay longer?* This closes the loop
from assessment fit → real employment outcomes, and is the evidence base for
refining the assessment.

## The one thing to know up front
This dashboard is a **frame that fills in over time.** Reviews accrue every 3
months and employee tracking just launched, so **today it will be nearly empty.**
It becomes meaningful after a few review cycles and enough hires per fit band.
That's expected — we're building the instrument now so the signal is captured
from here on. The UI must be honest about thin data, not paper over it.

## The core view: "Performance & retention by fit"
For each **fit band** (Strong fit · Consider · Caution · Not recommended),
computed over that org's **hired** employees whose original assessment produced
that band:

| column | meaning |
|---|---|
| Hired | # employees in this band |
| Reviewed | # with ≥1 review (the n behind the rating) |
| Avg rating | mean performance rating (1–5) across reviewed employees |
| Still employed | retention: % not terminated |

Rendered in the existing Reports style (horizontal bars + a small table), as a
new **"Does the assessment predict performance?"** section on `/admin/reports`
(the org's analytics home). A one-line summary also links from the Employees page.

## Honest small-n handling (the important design rule)
- Show the **sample size (Reviewed / Hired) everywhere** a rating appears.
- If a band has **fewer than 3 reviewed** employees, show the count but **grey
  out / caveat the rating** ("too few to read yet") instead of printing a
  precise-looking average from n=1.
- If there are **zero reviews org-wide**, the section shows a single empty state:
  "No reviews yet — this fills in as you complete quarterly reviews."
- Never render a trend or correlation claim in v1; just the honest table.

## Metric decisions (my recommended defaults)
1. **Performance measure = each employee's AVERAGE rating across their reviews**
   (more stable than a single latest review). Latest-only is the alternative.
2. **Population = all hired employees, including terminated** — so retention is
   real. (Terminated employees keep their last rating in the average.)
3. **Retention = % still `employed`.** Termination *reasons* are free text, so
   v1 does not categorize voluntary vs for-cause — just the rate.
4. **Small-n threshold = 3 reviewed** before a rating is shown as readable.

## Data / implementation
- No migration. Pure read/aggregate:
  `src/lib/employee-analytics.ts` → join `listEmployees(orgId)` +
  `fitByApplication(orgId)` (by `application_id`) + each employee's reviews →
  bucket by band, compute the four columns + n.
- New section component on the Reports page; a summary stat on Employees.
- Employees with no `application_id` (manual adds, future) are excluded from the
  fit breakdown but counted in a plain "untracked-fit" note.

## Explicitly OUT of v1 (later)
- Per-role breakdowns; time-to-first-review and tenure curves.
- Statistical significance / confidence; correlation coefficients.
- Export / methodology-version segmentation.
- Any automated "adjust the assessment" action — this informs, humans decide.

## Build order (verified on dev before deploy)
1. `src/lib/employee-analytics.ts` (+ a small unit test for the bucketing/avg).
2. Reports-page section + Employees summary line.
3. Verify on dev with seeded reviews across bands (incl. the empty + small-n
   states), then deploy once.
