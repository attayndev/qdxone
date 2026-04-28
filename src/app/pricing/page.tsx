import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export default function PricingPage() {
  return (
    <>
      <ApexHeader active="/pricing" />

      <main className="flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-center">
            Simple pricing.
          </h1>
          <p className="text-center text-[color:var(--brand-ink-muted)] mt-3 max-w-xl mx-auto">
            Pay annual to save 30% and get a 7-day free trial. Add on extra
            test types as your needs grow.
          </p>

          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PlanCard
              name="Starter"
              annualMonthly={25}
              monthly={35}
              quota={10}
              highlight={false}
            />
            <PlanCard
              name="Growth"
              annualMonthly={50}
              monthly={65}
              quota={25}
              highlight
            />
            <EnterpriseCard />
          </div>

          <div className="card mt-10 text-center max-w-xl mx-auto">
            <h2 className="font-extrabold text-lg">Add-on test types</h2>
            <p className="text-[color:var(--brand-ink-muted)] mt-2 text-sm">
              IQ, Cashier Math, and more (coming soon).{" "}
              <strong>$10/mo annual</strong> or <strong>$15/mo monthly</strong>{" "}
              per type, includes 5 tests/month.
            </p>
          </div>

          <div className="mt-12 text-center">
            <Link href="/signup" className="btn-primary">
              Start a 7-day trial
            </Link>
            <p className="mt-3 text-xs text-[color:var(--brand-ink-muted)]">
              Trial available on annual plans. Monthly bills on signup.
            </p>
          </div>
        </div>
      </main>
      <ApexFooter />
    </>
  );
}

function PlanCard({
  name,
  annualMonthly,
  monthly,
  quota,
  highlight,
}: {
  name: string;
  annualMonthly: number;
  monthly: number;
  quota: number;
  highlight: boolean;
}) {
  return (
    <div
      className={[
        "card",
        highlight
          ? "border-2 border-[color:var(--brand-pink)] relative"
          : "",
      ].join(" ")}
    >
      {highlight && (
        <span className="chip bg-[color:var(--brand-pink)] text-white absolute -top-3 left-6">
          Most popular
        </span>
      )}
      <h3 className="text-2xl font-black tracking-tight">{name}</h3>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-black">${annualMonthly}</span>
        <span className="text-[color:var(--brand-ink-muted)]">
          /mo billed annually
        </span>
      </div>
      <div className="mt-1 text-sm text-[color:var(--brand-ink-muted)]">
        or <strong>${monthly}/mo</strong> billed monthly
      </div>
      <ul className="mt-5 space-y-2 text-[15px]">
        <li>✓ {quota} questionnaires per month</li>
        <li>✓ Branded subdomain on qdx.one</li>
        <li>✓ Custom invitation links</li>
        <li>✓ Scoring + risk flags + recommendations</li>
        <li>✓ Internal notes &amp; hiring status tracking</li>
        <li>✓ 7-day free trial (annual plans only)</li>
      </ul>
      <div className="mt-5 text-xs text-[color:var(--brand-ink-muted)]">
        Overage: <strong>$3/test</strong> annual, <strong>$4/test</strong>{" "}
        monthly.
      </div>
    </div>
  );
}

function EnterpriseCard() {
  return (
    <div className="card">
      <h3 className="text-2xl font-black tracking-tight">Enterprise</h3>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-black">Contact us</span>
      </div>
      <div className="mt-1 text-sm text-[color:var(--brand-ink-muted)]">
        Custom pricing for multi-unit operators
      </div>
      <ul className="mt-5 space-y-2 text-[15px]">
        <li>✓ Unlimited questionnaires per month</li>
        <li>✓ Bring your own brandable domain</li>
        <li>✓ Custom invitation links</li>
        <li>✓ Scoring + risk flags + recommendations</li>
        <li>✓ Internal notes &amp; hiring status tracking</li>
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
