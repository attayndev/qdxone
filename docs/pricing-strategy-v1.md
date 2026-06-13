# QDX One — Pricing Strategy v1

**Last updated:** 2026-06-13
**Status:** Structure locked. Ready for marketing page, Stripe setup, and in-app feature gating.

> **Pricing update (2026-06-13) — simplified per-location price.** The
> volume-band curve below ($99/$79/$59/$49) was replaced with: **Solo $59/mo**
> (one location); **Operator $79/location, dropping to $69/location at 10+
> locations**; **Enterprise** unchanged ($2,500 floor + $50/loc). So Operator
> carries a modest per-location premium over running separate Solo accounts
> ($79 vs $59) — justified by one account + the Operator feature set (the
> consolidation FAQ). The tier *structure*, feature splits, seats, quotas, and
> overage caps below all still hold — only the base per-location price changed.
> The dollar examples and "volume discount" framing in the sections below are
> superseded by this note; `src/lib/plan.ts` is the source of truth.

---

## The three-tier ladder

| | **Solo** | **Operator** | **Enterprise** |
|---|---|---|---|
| **Who it's for** | Independent single-location restaurants | Multi-store franchisees and small chains | Large multi-unit groups, brand HQs, multi-brand |
| **Scale** | 1 location | 2+ locations (self-serve) | 25+ locations OR needs enterprise features |
| **Price** | $59/mo per location | $79/loc (2–9) · $69/loc (10+) | $2,500/mo floor · $50/loc above |
| **Annual** | 2 months free | 2 months free | Annual commitment standard |
| **Seats** | 2 (owner + manager) | 2 base + 1 per location | Unlimited |
| **Assessments / mo** | 25 included · $3 overage · capped at $25/mo | 50 per location · $2 overage · capped at $50/loc/mo | Unlimited |
| **Branded careers page + QR** | ✓ | ✓ | ✓ |
| **Assessment + verbal bands + fit tier** | ✓ | ✓ | ✓ |
| **Candidate pipeline + report cards** | ✓ | ✓ | ✓ |
| **Local crew benchmark** | ✓ | ✓ | ✓ |
| **Basic EEO + fairness flags (4/5ths rule)** | ✓ | ✓ | ✓ |
| **Email notifications** | ✓ | ✓ | ✓ |
| **AI job descriptions** | 3/mo (sales hook) | Unlimited | Unlimited |
| **SMS notifications** | — | ✓ | ✓ |
| **Multi-location careers page** | n/a | ✓ (auto on 2+ locations) | ✓ |
| **Cross-location benchmarking** | n/a | ✓ | ✓ |
| **Cross-store analytics + pipeline rollup** | n/a | ✓ | ✓ |
| **Advanced EEO reporting (EEO-1, OFCCP exports)** | — | ✓ | ✓ |
| **Brand hierarchy + cross-brand rollup** | — | — | ✓ |
| **SSO / SAML / SCIM** | — | — | ✓ |
| **API access + custom integrations** | — | — | ✓ |
| **White-glove support + dedicated CSM** | — | — | ✓ |

---

## Tier-by-tier positioning

### Solo — $49/mo per location

Sells the complete hiring loop for one location. The methodology-proof features (local benchmark, basic fairness flags) are included because they're what makes the assessment feel real and trustworthy at the single-store level. AI job descriptions get 3 free generations per month as a sales hook — costs almost nothing in API spend, gets the operator hooked.

**Positioning headline:** *"Everything you need to hire well, for the price of a single shift's labor."*

### Operator — Volume-discounted per location

Sells running a multi-store hiring operation. The gating logic is clean: features that only make sense with multiple locations (cross-location benchmarking, unified careers page, pipeline rollup) live here naturally. Cost-bearing features (SMS, unlimited AI) live here because per-use cost is justified by higher ACV. Volume discount rewards growth on the platform and closes the gap between self-serve and Enterprise.

Pricing math at common scales:
- 2 locations: $198/mo
- 5 locations: $395/mo
- 10 locations: $790/mo
- 25 locations: $1,475/mo
- 50 locations: $2,450/mo (still self-serve, $49/loc above 25)

**Positioning headline:** *"Hire consistently across every location. One careers page, one pipeline, one standard."*

### Enterprise — $2,500/mo floor, $50/loc above

Sells brand-level orchestration and compliance. The real enterprise gates — SSO, SCIM, API, brand hierarchy, custom contracts — live here and nowhere else. Crucially, **Enterprise is feature-driven, not size-forced.** A 30-location operator can stay on Operator self-serve ($1,470/mo) or move to Enterprise ($2,500/mo) — the choice depends on whether they need the enterprise features, not their location count.

Pricing math:
- 25 locations: Operator $1,475 · Enterprise $2,500 → Operator wins (no forced upgrade)
- 50 locations: Operator $2,450 · Enterprise $2,500 → roughly even, Enterprise has more features
- 75 locations: Operator $3,675 · Enterprise $3,750 → roughly even
- 100 locations: Operator $4,900 · Enterprise $5,000 → roughly even
- 250 locations: Operator $12,250 · Enterprise $12,500 → roughly even

The per-location price drop from $49 (Operator at scale) to $50 (Enterprise) is intentional: Enterprise customers get **better unit economics at scale plus the operational features franchises and multi-restaurant groups actually need.** Inverts the typical SaaS objection ("why do bigger customers pay more?").

**Positioning headline:** *"Built for brands. Better unit economics. The compliance and integration features your scale requires."*

---

## Key changes from the prior model

What moved and why:

| Feature | Old tier | New tier | Why |
|---|---|---|---|
| Local crew benchmark | Multi-unit only | All tiers | Engagement hook / methodology proof |
| Basic EEO + fairness flags | Multi-unit only | All tiers | Compliance scaffolding belongs everywhere |
| Advanced EEO reporting (EEO-1, OFCCP) | Multi-unit only | Operator+ | Real need starts at multi-location |
| Multi-location careers page | Growth tier feature | Structural (auto on 2+ locations) | Not a feature gate — it's a function of multi-location |
| AI job descriptions | Growth only | 3/mo at Solo, unlimited at Operator+ | Sales hook costs almost nothing |
| Volume discount | None | Built into Operator | Closes Growth → Multi-unit gap |
| Seats | 1 / 3 / unlimited | 2 / (2 + 1 per loc) / unlimited | Reflects real operational structure |
| Operator above 25 locations | Forced to Multi-unit | Continues at $49/loc | No punitive breakpoint |
| Enterprise positioning | Size-forced ("talk to us") | Feature-driven (optional even at scale) | Customer chooses based on need, not size |
| Overage cap | None | Solo $25/mo · Operator $50/loc/mo | Predictability for retention |

---

## Implementation checklist

What needs to change in the build:

**Stripe / billing:**
- Update or replace existing products/prices to reflect the new structure
- Operator's four price bands ($99/$79/$59/$49) — implement either as a single product with usage-tiered pricing or as four products with auto-tier-jumping
- Add overage caps (metered usage with a hard ceiling)
- Annual toggle remains 2 months free (≈16.7%)
- Enterprise: manual invoicing, no self-serve checkout

**In-app feature gating** (currently not enforced):
- SMS notifications: Operator+ only
- Unlimited AI job descriptions: Operator+ (Solo capped at 3/mo)
- Multi-location careers page: auto-available when org has 2+ locations on Operator+
- Cross-location benchmarking: requires 2+ locations on Operator+
- Advanced EEO reporting: Operator+
- SSO, brand hierarchy, API, SCIM: Enterprise only

**Marketing page:**
- Redo pricing table with the new three-tier structure
- Lead with the per-location math at common scales (2, 5, 10, 25)
- Surface the "better unit economics at scale" framing for Enterprise

**Database / org model:**
- Confirm location-count is tracked correctly for tier band logic
- Add seat-count enforcement (2 base + 1 per location for Operator)

---

## Beta customer migration

The current 5-location tester:
- **On the current Growth tier:** 5 × $99 = $495/mo
- **On the new Operator tier:** 5 × $79 = $395/mo (with volume discount)
- **Net:** they pay $100/mo less AND gain access to features that should already be available to them (cross-location benchmarking, basic EEO/fairness flags)
- **Communicate as:** "We're improving pricing — you're getting more value at a better rate."

General migration rule:
- If new pricing is equal or better for the beta customer → auto-migrate on next billing cycle
- If new pricing would be a price increase (unlikely under this structure) → grandfather for 12 months at current pricing, with option to opt in to new structure for new features

---

## Open decisions still to settle

1. **White-glove support scope for Enterprise.** What's actually included? Suggested baseline: dedicated CSM, quarterly business reviews, implementation assistance, custom training, SLA on response time (e.g., 4-hour business-hour response). Real cost-to-deliver — affects whether $2,500 is fat margin or fair pricing. Worth scoping before the first Enterprise sales conversation.

2. **Trial structure.** Currently 30 days. Options: (a) keep 30 days unlimited, (b) usage-cap the trial (30 days OR 25 completed assessments, whichever first), (c) shorten to 14 days with usage cap. Trade-off: longer trial reduces signup friction but extends time-to-revenue. Recommend keeping 30 days unlimited for v1 beta to maximize signal collection.

3. **Annual discount magnitude.** "2 months free" = ~16.7%. Standard SaaS practice runs 15–20%. Could anchor at 20% (2.4 months free) for stronger annual conversion. Trade-off vs. cash flow.

4. **Sub-Solo "Tester" tier.** Free or $19/mo with hard caps (5 assessments/mo, 1 seat, no benchmarks, branded "powered by QDX"). Top-of-funnel acquisition tool. Risk: cannibalizes Solo. Recommend: hold for v1, revisit if Solo conversion shows friction at $49.

5. **Multi-brand handling in Enterprise.** When an Enterprise customer operates multiple distinct restaurant brands (e.g., a franchisee with both Subway and Jersey Mike's locations), do they pay one floor or one per brand? Affects sales conversations. Suggested default: one floor per brand, with multi-brand discount available on negotiation.

6. **Single-location operators with multi-location ambitions.** Can a Solo customer get a discount commitment if they signal they'll be multi-location within 6 months? Loyalty hook. Probably not for v1 — too clever for the simplicity story.

---

## Pricing principles (for reference when answering future questions)

- **Scale, not features, is the upgrade trigger.** Customers move tiers because their operation grew, not because they want one more feature unlocked.
- **Better unit economics as you scale, not worse.** The per-location price drops as the customer grows — Enterprise customers should feel they got a discount, not a tax.
- **Methodology proof in every tier.** Local benchmark and basic fairness flags are in Solo because they're what makes the assessment trustworthy.
- **Enterprise is optional, not forced.** Customers move to Enterprise when they need SSO, brand hierarchy, or compliance features — not when their location count crosses a threshold.
- **Overage is for spam protection, not revenue extraction.** Caps prevent surprise bills; the goal is the subscription, not the metered charge.
