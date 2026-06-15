# QDX One — Enterprise & Multi-Location Compliance FAQs (internal / counsel source)

> **Internal draft for product + legal review.** This is the SOURCE doc with every
> `[CONFIRM]` preserved. The PUBLIC page (`src/app/enterprise/page.tsx`) is a
> *softened* version that reframes unbuilt capabilities as "designed to support /
> roadmap / talk to us" and resolves the `[CONFIRM]`s conservatively — it does NOT
> assert present-tense compliance capabilities that aren't built. Before changing
> the public page to claim any of the items below as shipped, the underlying
> capability must actually exist AND counsel must review the wording.
>
> Overstating compliance ("EEOC-compliant," "bias-free," "exempt from Local Law
> 144") creates real exposure — keep public claims to what can be substantiated.

## Built today (safe to state publicly, present-tense)
- Human-in-the-loop / "score, don't filter" — a person makes every decision; the
  platform never auto-rejects.
- Plain Low/Medium/High ratings shown; underlying numbers retained for analysis.
- Voluntary EEO questionnaire, stored in a separate partition, aggregate-only,
  never shown to deciders or tied to a candidate result.
- Aggregate four-fifths (80%) adverse-impact flagging.
- Local crew benchmark, aggregate-only, framed as "inform not define."
- Designed to align with the EEOC Uniform Guidelines (a *design* statement).

## NOT built — roadmap (public page says "roadmap / designed to / talk to us")
- EEO-1 / OFCCP filing-ready exports
- Audit-ready compliance exports
- Brand hierarchy + cross-brand rollup reporting
- Tier 2/3 population-based norming
- Candidate notice / disclosure templates + alternative-process pathway
- Built-in ADA accommodations (alternative formats, extended time, screen reader)
- Independent third-party bias audit artifacts (vendor cannot self-audit)
- A completed formal validation study (state methodology/approach, not a finished study)
- Documented data posture specifics (encryption, retention, sub-processors)

## Priority items to confirm with product + counsel before claiming as shipped
1. **Validation evidence** — strategy, sample sizes, whether a formal study exists; a technical/validation report.
2. **Independent bias audits** — whether QDX commissions third-party audits and what artifacts it gives customers (LL144 etc.). The vendor cannot be the auditor.
3. **AEDT positioning** — the carefully worded stance on whether/when QDX is in scope.
4. **Candidate notice, opt-out/alternative process, human-review** — built in vs. customer-configured.
5. **Data posture** — encryption, EEO/selection separation, retention, sub-processors, data ownership.
6. **EEO/OFCCP report specifics** — exact formats; filing-ready or compile-yourself.
7. **Adverse-impact monitoring** — cadence, protected categories, minimum sample sizes.
8. **ADA accommodations** — supported formats + reasonable-accommodation pathway.
9. **Contractual allocation** of compliance responsibility (QDX vs. customer).
10. **Jurisdiction coverage** — which state/local regimes are actively supported; keep current.

---

*(Full original answer drafts with inline [CONFIRM] notes are preserved in version
history / the design thread; the lists above are the actionable summary. The live,
softened answers are in `src/app/enterprise/page.tsx`.)*
