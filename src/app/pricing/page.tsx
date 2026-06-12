import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "QDX pricing — per-location restaurant hiring",
  description:
    "Start at $49/location. Pay for the completed assessments you use. Grow into SMS, AI, and analytics. 30-day free trial.",
};

export default function PricingPage() {
  return (
    <>
      <ApexHeader active="/pricing" />

      <main className="flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-center">
            Simple, per-location pricing.
          </h1>
          <p className="text-center text-[color:var(--brand-ink-muted)] mt-3 max-w-xl mx-auto">
            Start with everything you need to hire. Grow into a team, SMS, AI,
            and analytics as you scale. 30-day free trial on both self-serve
            plans.
          </p>

          <div className="mt-10 grid md:grid-cols-3 gap-5 items-start">
            <PlanCard
              name="Starter"
              price={49}
              quota="25"
              overage="3"
              seats="1 user"
              tagline="Everything you need to hire for one store."
              features={STARTER_FEATURES}
            />
            <PlanCard
              name="Growth"
              price={99}
              quota="75"
              overage="2"
              seats="3 users"
              tagline="Everything in Starter, plus:"
              features={GROWTH_FEATURES}
              highlight
            />
            <MultiUnitCard />
          </div>

          <p className="mt-6 text-center text-sm text-[color:var(--brand-ink-muted)] max-w-2xl mx-auto">
            A completed assessment is the billable unit — a candidate who
            applies but doesn&apos;t finish costs nothing. Go past your monthly
            included number and candidates still apply; extra completed
            assessments simply bill at your plan&apos;s per-assessment rate.
          </p>

          <div className="mt-12 text-center">
            <Link href="/signup" className="btn-primary">
              Start free
            </Link>
            <p className="mt-3 text-xs text-[color:var(--brand-ink-muted)]">
              30-day free trial. Card captured at signup, first charge after
              the trial. Cancel anytime.
            </p>
          </div>
        </div>
      </main>
      <ApexFooter />
    </>
  );
}

const STARTER_FEATURES = [
  "Branded hiring page + QR codes",
  "Configurable application form & roles",
  "5-minute validated assessment",
  "Verbal bands + fit recommendation",
  "Quality + screener flags",
  "Candidate pipeline & review",
  "Email notifications",
];

const GROWTH_FEATURES = [
  "3 team members",
  "SMS candidate notifications",
  "AI-written job descriptions",
  "Hiring analytics & reports",
  "Multi-location careers page",
];

const MULTI_UNIT_FEATURES = [
  "Unlimited assessments & team",
  "EEO / adverse-impact dashboard",
  "Hiring benchmarks & local norms",
  "Brand hierarchy & rollup reporting",
  "SSO & dedicated support",
];

function PlanCard({
  name,
  price,
  quota,
  overage,
  seats,
  tagline,
  features,
  highlight,
}: {
  name: string;
  price: number;
  quota: string;
  overage: string;
  seats: string;
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
        <span className="text-4xl font-black">${price}</span>
        <span className="text-[color:var(--brand-ink-muted)] text-sm">
          /mo per location
        </span>
      </div>
      <div className="mt-1 text-sm font-semibold text-[color:var(--brand-pink-600)]">
        {quota} assessments / mo, then ${overage} each
      </div>
      <div className="mt-0.5 text-xs text-[color:var(--brand-ink-muted)]">
        {seats} · 30-day free trial
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

function MultiUnitCard() {
  return (
    <div className="card">
      <h3 className="text-2xl font-black tracking-tight">Multi-unit</h3>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-black">Let&apos;s talk</span>
      </div>
      <div className="mt-1 text-sm text-[color:var(--brand-ink-muted)]">
        For franchisees, groups & brands
      </div>
      <p className="mt-4 text-sm font-semibold">Everything in Growth, plus:</p>
      <ul className="mt-2 space-y-2 text-[15px]">
        {MULTI_UNIT_FEATURES.map((f) => (
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
