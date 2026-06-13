import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";
import { operatorPerLocation, monthlyBasePrice } from "@/lib/plan";

export const metadata = {
  title: "QDX pricing — per-location restaurant hiring",
  description:
    "Start at $49/location. Per-location pricing that drops as you grow. Pay for the completed assessments you use. 30-day free trial.",
};

// Per-location math at common scales, computed from the live pricing model.
const SCALES = [2, 5, 10, 25].map((n) => ({
  n,
  perLoc: operatorPerLocation(n),
  total: monthlyBasePrice("operator", n),
}));

export default function PricingPage() {
  return (
    <>
      <ApexHeader active="/pricing" />

      <main className="flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-center">
            Per-location pricing that drops as you grow.
          </h1>
          <p className="text-center text-[color:var(--brand-ink-muted)] mt-3 max-w-xl mx-auto">
            Start with everything you need to hire one store. Add locations and
            your per-location price goes <em>down</em>, not up. 30-day free trial
            on both self-serve plans.
          </p>

          <div className="mt-10 grid md:grid-cols-3 gap-5 items-start">
            <PlanCard
              name="Solo"
              priceLine="$69"
              priceSub="/mo per location"
              annualNote="or $690/yr (2 months free)"
              meta="1 location · 2 users"
              quotaLine="25 assessments/mo, then $3 each (capped $25/mo)"
              tagline="Everything you need to hire for one store."
              features={SOLO_FEATURES}
            />
            <PlanCard
              name="Operator"
              priceLine="$69→$59"
              priceSub="/loc per mo (10+ loc)"
              annualNote="2 months free on annual"
              meta="2+ locations · 2 + 1/location users"
              quotaLine="50 assessments/location/mo, then $2 each (capped $50/loc)"
              tagline="Everything in Solo, plus:"
              features={OPERATOR_FEATURES}
              highlight
            />
            <EnterpriseCard />
          </div>

          {/* Operator volume math */}
          <div className="mt-8 card max-w-2xl mx-auto">
            <h3 className="font-extrabold">Operator — what you&apos;d pay</h3>
            <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
              Every location bills at the rate for your total count.
            </p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {SCALES.map((s) => (
                <div key={s.n} className="rounded-xl bg-[color:var(--brand-cream)] p-3">
                  <div className="text-xs text-[color:var(--brand-ink-muted)]">
                    {s.n} locations
                  </div>
                  <div className="text-xl font-black mt-1">${s.total}/mo</div>
                  <div className="text-xs text-[color:var(--brand-ink-muted)]">
                    ${s.perLoc}/loc
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-[color:var(--brand-ink-muted)] max-w-2xl mx-auto">
            A completed assessment is the billable unit — applicants who
            don&apos;t finish cost nothing. Overage is capped each month, so
            there are no surprise bills.
          </p>

          <div className="mt-10 text-center">
            <Link href="/signup" className="btn-primary">
              Start free
            </Link>
            <p className="mt-3 text-xs text-[color:var(--brand-ink-muted)]">
              30-day free trial. Card captured at signup, first charge after the
              trial. Cancel anytime.
            </p>
          </div>
        </div>
      </main>
      <ApexFooter />
    </>
  );
}

const SOLO_FEATURES = [
  "Branded hiring page + QR codes",
  "Configurable application form & roles",
  "5-minute validated assessment",
  "Verbal bands + fit recommendation",
  "Local crew benchmark",
  "Basic EEO + fairness flags (4/5ths)",
  "Candidate pipeline & review",
  "Email notifications",
];

const OPERATOR_FEATURES = [
  "One account, login & pipeline for every location",
  "SMS notifications",
  "Unlimited AI job descriptions",
  "Hiring analytics & cross-store rollup",
  "Multi-location careers page",
  "Cross-location benchmarking",
  "Advanced EEO reporting (EEO-1, OFCCP)",
];

const ENTERPRISE_FEATURES = [
  "Unlimited assessments & seats",
  "Brand hierarchy + cross-brand rollup",
  "Tier 2/3 norming",
  "Audit-ready compliance exports",
  "SSO / SAML / SCIM + API",
  "White-glove support & dedicated CSM",
];

function PlanCard({
  name,
  priceLine,
  priceSub,
  annualNote,
  meta,
  quotaLine,
  tagline,
  features,
  highlight,
}: {
  name: string;
  priceLine: string;
  priceSub: string;
  annualNote: string;
  meta: string;
  quotaLine: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "card",
        highlight ? "border-2 border-[color:var(--brand-pink)] relative" : "",
      ].join(" ")}
    >
      {highlight && (
        <span className="chip bg-[color:var(--brand-pink)] text-white absolute -top-3 left-6">
          Most popular
        </span>
      )}
      <h3 className="text-2xl font-black tracking-tight">{name}</h3>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-black">{priceLine}</span>
        <span className="text-[color:var(--brand-ink-muted)] text-sm">
          {priceSub}
        </span>
      </div>
      <div className="mt-1 text-xs text-[color:var(--brand-ink-muted)]">
        {annualNote}
      </div>
      <div className="mt-2 text-sm font-semibold text-[color:var(--brand-pink-600)]">
        {quotaLine}
      </div>
      <div className="mt-0.5 text-xs text-[color:var(--brand-ink-muted)]">
        {meta} · 30-day free trial
      </div>
      <p className="mt-4 text-sm font-semibold">{tagline}</p>
      <ul className="mt-2 space-y-2 text-[15px]">
        {features.map((f) => (
          <li key={f}>✓ {f}</li>
        ))}
      </ul>
    </div>
  );
}

function EnterpriseCard() {
  return (
    <div className="card">
      <h3 className="text-2xl font-black tracking-tight">Enterprise</h3>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-black">Let&apos;s talk</span>
      </div>
      <div className="mt-1 text-xs text-[color:var(--brand-ink-muted)]">
        $2,500/mo floor · better unit economics at scale
      </div>
      <div className="mt-2 text-sm text-[color:var(--brand-ink-muted)]">
        For brands, groups & multi-brand operators
      </div>
      <p className="mt-4 text-sm font-semibold">Everything in Operator, plus:</p>
      <ul className="mt-2 space-y-2 text-[15px]">
        {ENTERPRISE_FEATURES.map((f) => (
          <li key={f}>✓ {f}</li>
        ))}
      </ul>
      <Link
        href="/demo"
        className="btn-primary w-full text-center inline-block mt-6"
      >
        Talk to us
      </Link>
    </div>
  );
}
