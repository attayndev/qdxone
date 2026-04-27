import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";
import DemoForm from "@/components/DemoForm";

export const metadata = {
  title: "Book a 15-min QDX demo",
  description:
    "See QDX on a real candidate. Quick walkthrough for restaurant operators — QSR, fast-casual, and independent.",
};

export default function DemoPage() {
  return (
    <>
      <ApexHeader active="/demo" />
      <main className="flex-1">
        <section className="px-4 sm:px-6 pt-12 pb-10">
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-10 items-start">
            <div>
              <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)] mb-4">
                Book a demo
              </span>
              <h1 className="text-4xl font-black tracking-tight leading-[1.05]">
                15 minutes.{" "}
                <span className="text-[color:var(--brand-pink)]">
                  Operator to operator.
                </span>
              </h1>
              <p className="mt-5 text-[color:var(--brand-ink-muted)] text-lg">
                Tell me about your shop and the hiring pain you&apos;re
                trying to solve. I&apos;ll show you exactly what a candidate
                report looks like and whether QDX makes sense for your
                situation.
              </p>
              <ul className="mt-6 space-y-2 text-[15px]">
                <li>✓ Walkthrough of the assessment + report</li>
                <li>✓ Pricing sized to your footprint</li>
                <li>✓ No high-pressure sales pitch</li>
              </ul>
              <p className="mt-6 text-sm text-[color:var(--brand-ink-muted)]">
                Just want to start? You can{" "}
                <a
                  href="/signup"
                  className="underline text-[color:var(--brand-pink-600)]"
                >
                  sign up directly
                </a>{" "}
                — no demo required.
              </p>
            </div>
            <div className="card">
              <DemoForm />
            </div>
          </div>
        </section>
      </main>
      <ApexFooter />
    </>
  );
}
