# Site Strengthening v2 — deliverables

Per-page revised copy (copy-paste ready, inline **[CHANGED]** markers) +
appendices. Source of truth: the Facts File in the brief. Nothing here has
been applied to the codebase yet — these documents are the review artifact.

## Files
- `01-home.md` … `10-demo-11-about.md` — revised copy per page
- `appendix-a-counsel-io-review.md` — 13 passages for counsel / I-O review
- `appendix-b-evidence-to-collect.md` — 6 proof assets w/ source & slot
- `appendix-c-confirm-items.md` — 10 consolidated [CONFIRM] items

## Acceptance criteria — results

- ✅ **Homepage ≤80% word count:** ~1,070 vs 1,452 current (target ≤1,161).
  Achieved via FAQ 9→4, illustrative items, de-duplication — no lost
  meaning (every cut concept lives at full strength on its own page).
- ✅ **Zero prohibited decision-assistance language** in revised copy —
  verified by grep; remaining instances are quoted old text in change logs
  and prohibition instructions for screenshots. Removed: "fit
  recommendation" (×2 pages), "ranks/ranked" (×5), "deserve" (×4),
  "QDXone decides," "recommendations are decision support," "overall fit."
- ✅ **Zero fabricated metrics/quotes/customers/credentials** — all proof
  is placeholdered with collection specs (Appendix B). One unsupported
  claim removed ("most people finish it").
- ✅ **Zero live assessment items** — all samples replaced with three
  site-written illustrative items; per-item construct chips and
  item→construct "why we ask" mappings removed everywhere.
- ✅ **Each core concept stated fully once:** volume trap (home + full
  treatment on /shift-ready-hiring), resumes-don't-show-shift-behavior
  (home "What shift-ready looks like" lead), humans-decide (home step 3 in
  full; brief echoes elsewhere), every-applicant-assessed
  (/shift-ready-hiring principle 1 in full).
- ✅ **Legal/scientific claims:** all remaining instances are practice
  descriptions; 13 flagged verbatim in Appendix A. Nothing silently
  softened — every change is marked.
- ✅ **Fact traceability:** all stated facts trace to the Facts File; gaps
  carry [CONFIRM] (10 items, Appendix C).
- ◑ **Benchmark test (Workstream, Homebase, Harri, Fountain):** those four
  sell breadth (scheduling/payroll suites) or enterprise volume-automation
  (Fountain). This site now does the opposite deliberately: one problem
  (the Volume Trap), one mechanism (assess every applicant → bands), one
  named category, a founder who runs a restaurant, and no feature-bloat
  language. Weakest page against the benchmark: /demo (thin but honest —
  fine for a founder-led motion); strongest: home, /shift-ready-hiring,
  /assessments. Re-run this test after proof assets land — social proof is
  the one axis where the benchmark products currently win.

## Known issues from the brief — disposition
1. Live sample items → replaced (home, /assessments) ✔
2. "Fit recommendation"/"ranks" → removed everywhere ✔
3. "Fairness is built in" → practice description (/faq) ✔
4. Personality-test contradiction → category owned honestly (/faq, home,
   /assessments) ✔
5. Enterprise card truncation ("Brands & groups assessments") → fixed ✔
6. Duplicate pricing FAQs → merged (/faq); homepage pricing FAQs cut ✔
7. ™ density → hero + footer only ✔ (style call logged, Appendix C #9)
8. "Not personality astrology" → retired ✔
9. No social proof → placeholders + Appendix B collection plan ✔

## Implementation notes (when approved)
- All changes are copy-level; no IA, route, or component changes except:
  homepage FAQ items 9→4 (array edit), LookInside structure (chips
  removed), and the two new placeholder sections (proof strip, screenshot
  block) which should ship HIDDEN until assets exist.
- Screenshot prerequisite: audit product UI strings for Constraint-1
  language before capturing (the UI's own "Strong fit / Consider" labels —
  if present — are a product copy question that predates screenshots;
  Appendix B #6).
- Demo re-sequencing (manager-first) is a recommendation, not written copy.
