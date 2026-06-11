import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "QDX pricing — per-location restaurant hiring",
  description:
    "Every plan has the full platform. Pay for the volume of completed assessments that fits your restaurant. 30-day free trial.",
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
            Every plan includes the full platform. You only pay for completed
            assessments — pick the volume that fits your restaurant. 30-day free
            trial on all of them.
          </p>

          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <PlanCard name="Starter" price={49} quota="25" />
            <PlanCard name="Growth" price={99} quota="100" highlight />
            <PlanCard name="Pro" price={249} quota="Unlimited" />
            <EnterpriseCard />
          </div>

          <p className="mt-6 text-center text-sm text-[color:var(--brand-ink-muted)] max-w-2xl mx-auto">
            A completed assessment is the billable unit — a candidate who
            applies but doesn&apos;t finish costs nothing. Hit your monthly
            number and candidates can still apply; you just upgrade for more
            headroom. No overage surprises.
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

const FEATURES = [
  "Branded hiring page + QR codes",
  "Configurable application form & roles",
  "5-minute validated assessment",
  "Verbal bands + fit recommendation",
  "Quality + screener flags",
  "Candidate pipeline & review",
];

function PlanCard({
  name,
  price,
  quota,
  highlight,
}: {
  name: string;
  price: number;
  quota: string;
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
        {quota} completed assessments / mo
      </div>
      <ul className="mt-5 space-y-2 text-[15px]">
        {FEATURES.map((f) => (
          <li key={f}>✓ {f}</li>
        ))}
        <li>✓ 30-day free trial</li>
      </ul>
    </div>
  );
}

function EnterpriseCard() {
  return (
    <div className="card">
      <h3 className="text-2xl font-black tracking-tight">Enterprise</h3>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-black">Contact us</span>
      </div>
      <div className="mt-1 text-sm text-[color:var(--brand-ink-muted)]">
        For brands & large multi-unit groups
      </div>
      <ul className="mt-5 space-y-2 text-[15px]">
        <li>✓ Everything in Pro, unlimited</li>
        <li>✓ Brand-level rollup reporting</li>
        <li>✓ Multi-location & franchise hierarchy</li>
        <li>✓ Bring your own domain</li>
        <li>✓ SSO & dedicated support</li>
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
