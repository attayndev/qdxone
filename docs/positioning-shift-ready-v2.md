# QDXone positioning v2 — The Shift-Ready Platform

**Status:** DRAFT for Yan's sign-off (2026-07-29). Supersedes the scope of
`docs/positioning-shift-ready-hiring.md` at the *platform* level; that doc's
Applicant-Volume-Trap narrative survives intact as the **Hiring pillar's** story.

## Why now
The product is no longer hiring-only. It now spans **hire → schedule → manage**:
Shift-Ready Hiring (apply + assessment + scored shortlist), Scheduling (weekly
builder, availability, time-off, open-shift claim/drop, targeted swaps, labor-cost
projection), and Team management (employee tracking, per-dimension performance
reviews, assessment-vs-performance analytics, benchmark-the-whole-team). Framing
the site as "Shift-Ready Hiring" now *undersells* it. Yan's decision (2026-07-29):
umbrella = **The Shift-Ready Platform**, and **it all begins with Shift-Ready
Hiring**.

## Naming architecture (decided + recommended)
- **Master brand: The Shift-Ready Platform.** The umbrella noun. Tagline register:
  "One platform, from application to schedule."
- **Pillar 1 — Shift-Ready Hiring™** (RETAINED, the entry point). Keeps the ™ and
  the Applicant-Volume-Trap story. This protects the existing mark / the floated
  USPTO filing.
- **Pillar 2 — Scheduling.** Recommend a plain, product-descriptive name (not
  "Shift-Ready Scheduling") so we don't over-brand or dilute the one marked term.
- **Pillar 3 — Team management.** Same rationale. (Covers reviews + the
  assessment→performance loop, which is the differentiated part.)
- **™ convention unchanged:** only **Shift-Ready Hiring™** carries ™, on first/most
  prominent use per page. "The Shift-Ready Platform" is the master brand in running
  text; whether to ™/file it is a **counsel question** (see Trademark below).

## The narrative spine (new canonical statement)
> Restaurant operators don't just need to hire well — they need the people they
> hire to stay shift-ready. Hiring is where it starts: every applicant completes a
> five-minute assessment, so you know who to call first instead of drowning in a
> pile of resumes. But the same signal keeps working after the hire — you schedule
> the team, review them on the qualities that matter, and finally see whether the
> assessment predicted how they'd actually do on the floor.
>
> **The Shift-Ready Platform. It begins with Shift-Ready Hiring™ — and it doesn't
> stop there.**

Load-bearing pieces preserved from v1: the **Applicant Volume Trap** enemy (Hiring
pillar), **score-don't-filter**, "who to call first," the four categories
(Reliability & Drive / People Skills / Ownership / Composure). New load-bearing
idea: **the assessment is one thread that runs hire→schedule→review** (the loop no
competitor has, because they don't own the hiring signal).

## Home page (`ApexLanding.tsx`) — concrete changes
1. **Hero.** `Shift-Ready Hiring™ / for restaurants.` → **`The Shift-Ready
   Platform` / `for restaurants.`** Sub-promise stays punchy but widens:
   "Know who to call first" → keep as the hiring hook OR promote a lifecycle line
   ("Hire shift-ready. Then run the shift."). *Recommend keeping "Know who to call
   first" as a secondary line and leading the paragraph with the platform span.*
2. **NEW section "One platform, three jobs"** (insert after `VolumeTrap`, before
   `HowItWorks`): three cards — Shift-Ready Hiring™ / Scheduling / Team management,
   each 1 sentence + a "begins with hiring" ordering cue. This is the core new
   content.
3. **VolumeTrap** stays (it's the Hiring pillar's argument); its closing CTA link
   "What is Shift-Ready Hiring? →" stays pointing at `/shift-ready-hiring`.
4. **HowItWorks** heading "How Shift-Ready Hiring works." → keep, but retitle the
   section context so it reads as the *hiring* pillar's how-to (the platform's
   other pillars get their own light treatment in the new section, deep pages
   later).
5. **PricingPeek** copy must reflect packaging (see Open Question P1).
6. **FinalCta** "Shift-Ready Hiring, built for the restaurant world." → "**The
   Shift-Ready Platform, built for the restaurant world.**"; button "Try
   Shift-Ready Hiring" → "Start free" (or "Try the Shift-Ready Platform").

## Nav / header / footer (`ApexHeader.tsx`)
- **Nav:** consider adding a "Platform" or "Scheduling" entry once pillar content
  exists. v1 of this rework: keep nav, but the footer **Product** column gains
  **Scheduling** and **Team management** links (even if they anchor to home
  sections until dedicated pages exist).
- **Footer tagline:** "Shift-Ready Hiring™ for restaurants. Know who to call
  first." → "**The Shift-Ready Platform for restaurants. Hire shift-ready, then run
  the shift.**"

## Other surfaces — checklist (≈10 files, ~26 occurrences)
- `src/app/layout.tsx` — `<title>`/meta/OG: "Shift-Ready Hiring" → platform framing
  (keep "Shift-Ready Hiring" in the description as the entry pillar for SEO).
- `src/app/shift-ready-hiring/page.tsx` — KEEP as the Hiring-pillar deep page
  (light touch: add a "part of The Shift-Ready Platform" breadcrumb/line + a link
  out to the other pillars). Do NOT rename the route.
- `src/app/how-it-works/page.tsx` — frame as the hiring walkthrough; add a short
  "after you hire" coda pointing to scheduling + management.
- `src/app/for-qsr/page.tsx`, `for-independents/page.tsx` — audience pages: add one
  paragraph each that the platform now runs the schedule + reviews, not just hiring.
- `src/app/pricing/page.tsx` — packaging per P1.
- `src/app/faq/page.tsx` — add 1–2 Q&A ("Does it do scheduling / manage my team?").
- `src/app/about/page.tsx`, `src/app/demo/page.tsx` — term swaps only.
- `docs/positioning-shift-ready-hiring.md` — add a header note pointing here for the
  platform level; leave the hiring narrative as the pillar canon.

## Guardrails to preserve (do NOT regress)
- No decision-assistance language (fit "recommendation"/"ranks"/"decides"); score
  never filters. Fairness = practice descriptions only. Illustrative assessment
  items only (never live items / construct maps). The **operator mobile app is
  never mentioned** on the site. Candidate-facing copy stays warm
  ([[careers_copy_empathetic]]). Homepage word budget stayed lean last time (~1,070)
  — adding a pillar section means trimming elsewhere, not sprawling.
- **New claims must stay honest:** describe scheduling/management as *features that
  exist*, no efficiency stats we can't back. No screenshots until real assets exist
  (respect the existing HIDDEN placeholders).

## Trademark
- **Shift-Ready Hiring™** — unchanged; keep ™, this is the mark worth protecting.
- **The Shift-Ready Platform** — new master brand. Decide with counsel whether to
  ™ it and whether it changes the pending "Shift-Ready Hiring" filing. Flag, don't
  block the copy work.

## Open questions for Yan (blockers for the copy)
- **P1 — Packaging. FULLY DECIDED (Yan, 2026-07-29, across 3 messages):**
  - Scheduling + Team management **included on EVERY plan**, +$20 to each base.
  - **SMS + AI job-writer UNGATED** — now on every plan (were Operator-only).
  - **Added-location price $50 → $59.**
  - **Final prices:** **Solo $79/mo** (1 location) · **Operator $99/mo + $59 per
    additional location** · Enterprise custom.
  - **Solo→Operator differentiator is now purely single- vs multi-location**
    (unified login across stores, cross-store reporting/benchmark, one careers page,
    advanced modules/EEO). Everything else — assessments, SMS, AI, scheduling, team
    management — is on both.
  - Product change required: `hasFeature` flips `sms` + `ai_job_descriptions` to all
    tiers; `SOLO_PRICE`=79, `OPERATOR_PRICE`=99, new `ADDED_LOCATION_PRICE`=59;
    `monthlyBasePrice` → graduated (`99 + 59×(locations−1)` for Operator).
  - ⚠️ **Stripe/.env NOT touched here** — advertised prices + in-app gates only.
    Beta has no conversions (BETA_NO_TRIAL_END), so advertised≠billed is safe; the
    Stripe price objects + env price IDs must be reconciled before billing launch
    (see [[mvp_pricing]]).
- **P2 — Dedicated pillar pages now or later?** *Recommend later:* v1 of this rework
  folds Scheduling + Team-management into the home "three jobs" section + a coda on
  how-it-works; ship dedicated `/scheduling` and `/team` pages as a follow-up.
- **P3 — Hero sub-line.** Keep "Know who to call first" (hiring hook, proven) as a
  secondary line, or lead with a lifecycle promise? *Recommend keep it secondary.*

## Build plan (after sign-off)
One batch, mirroring the last repositioning: (1) new home "three jobs" section +
hero/footer/CTA swaps, (2) meta/title, (3) audience + how-it-works codas, (4)
pricing per P1, (5) FAQ adds, (6) term swaps on about/demo/category page, (7)
positioning-doc header note. Verify every marketing route renders 200 + no stray
"Shift-Ready Hiring" where the umbrella should read, then deploy.
