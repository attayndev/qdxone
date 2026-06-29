import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "QDX pricing — per-location restaurant hiring",
  description:
    "Flat per-location pricing with unlimited assessments. Solo $59/location, Operator $79/location for the multi-store toolkit, Enterprise for brands. 30-day free trial.",
};

export default function PricingPage() {
  return (
    <>
      <ApexHeader active="/pricing" />

      <main className="flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-center">
            Simple per-location pricing.
          </h1>
          <p className="text-center text-[color:var(--brand-ink-muted)] mt-3 max-w-xl mx-auto">
            <strong>Unlimited assessments on every plan</strong> — assess everyone
            who applies, no caps, no surprise bills. Pay a flat rate per location;
            Operator adds the multi-store power tools. 30-day free trial.
          </p>

          <div className="mt-10 grid md:grid-cols-3 gap-5 items-start">
            <PlanCard
              name="Solo"
              priceLine="$59"
              priceSub="/mo"
              annualNote="or $590/yr (2 months free)"
              meta="1 location · 2 users"
              tagline="Everything you need to hire for one store."
              features={SOLO_FEATURES}
            />
            <PlanCard
              name="Operator"
              priceLine="$79"
              priceSub="/mo per location"
              annualNote="or $790/yr (2 months free)"
              meta="2+ locations · 2 + 1/location users"
              tagline="Everything in Solo, plus:"
              features={OPERATOR_FEATURES}
              highlight
            />
            <EnterpriseCard />
          </div>

          <p className="mt-8 text-center text-sm text-[color:var(--brand-ink-muted)] max-w-2xl mx-auto">
            No per-assessment fees and no caps — you only pay per location, so a
            busy hiring month never costs extra.
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
  "Unlimited assessments",
  "Your own hiring page + QR codes",
  "Custom application form & roles",
  "5-minute assessment + Low/Medium/High ratings",
  "Benchmark against your own crew",
  "Basic fairness checks",
  "Ranked applicant list & review",
  "Email notifications",
];

const OPERATOR_FEATURES = [
  "Manage every location from one login",
  "One hiring page + ranked list across stores",
  "SMS notifications + candidate texting",
  "AI-written job posts",
  "Reports that compare your stores",
  "Fairness checks across your stores",
];

const ENTERPRISE_FEATURES = [
  "Unlimited assessments & logins",
  "Reporting across many brands",
  "Company-wide single sign-on",
  "Developer connection (API)",
  "Dedicated contact & onboarding help",
];

function PlanCard({
  name,
  priceLine,
  priceSub,
  annualNote,
  meta,
  tagline,
  features,
  highlight,
}: {
  name: string;
  priceLine: string;
  priceSub: string;
  annualNote: string;
  meta: string;
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
      <div className="mt-2 text-xs text-[color:var(--brand-ink-muted)]">
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
