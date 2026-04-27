import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "QDX for QSR & multi-unit operators",
  description:
    "Standardize hiring across stores. Cut weak applicants from the funnel before they cost a shift leader 30 minutes.",
};

export default function ForQsrPage() {
  return (
    <>
      <ApexHeader active="/for-qsr" />
      <main className="flex-1">
        <section className="px-4 sm:px-6 pt-12 pb-10">
          <div className="max-w-3xl mx-auto">
            <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)] mb-4">
              For QSR & multi-unit
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              Standardize how you hire.{" "}
              <span className="text-[color:var(--brand-pink)]">
                Across every store.
              </span>
            </h1>
            <p className="mt-5 text-lg text-[color:var(--brand-ink-muted)]">
              Frontline turnover is brutal. Manager hours are scarce. Brand
              consistency matters. QDX gives every location the same screen,
              the same scoring, and the same recommendation logic — so a
              strong candidate at one store looks like a strong candidate at
              all of them.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center">
              The QSR hiring math.
            </h2>
            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              <Stat big="20+" small="minutes per interview, multiplied by every weak applicant your manager sat with this week." />
              <Stat big="60–100%" small="annual turnover in many QSR concepts. Bad first hires drive bad second hires." />
              <Stat big="$3–5K" small="commonly cited cost of one frontline hire that washes out in 30 days." />
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight">
              What changes when you put QDX in front of the funnel.
            </h2>
            <ul className="mt-6 space-y-4 text-[16px] leading-relaxed">
              <Bullet
                title="Manager time goes back where it belongs."
                body="Your shift leaders stop interviewing applicants who would have walked out by week two. The interviews they do run are with candidates that already cleared a behavioral bar."
              />
              <Bullet
                title="Hiring quality stops being a personality lottery."
                body="Different stores, different managers, different hiring instincts. QDX gives every store the same scored signal so the bar doesn't drift."
              />
              <Bullet
                title="Onboarding survives turnover."
                body="When you spend training hours on people who'll actually stay, your team retention compounds. New stores ramp faster."
              />
              <Bullet
                title="Brand consistency, even under pressure."
                body="The behaviors we screen for — composure, customer instincts, rule-fit — are the ones guests notice. Hire them in. Don't try to coach them in."
              />
            </ul>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-ink)] text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Multi-unit pricing? Talk to us.
            </h2>
            <p className="mt-4 text-white/80">
              If you operate 3+ locations and want a single account that
              spans every store, book a quick walkthrough and we&apos;ll size
              it for your footprint.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/demo" className="btn-primary">
                Book a 15-min demo
              </Link>
              <Link
                href="/signup"
                className="btn-ghost !text-white !border-white hover:!bg-white hover:!text-[color:var(--brand-ink)]"
              >
                Start a single-store trial
              </Link>
            </div>
          </div>
        </section>
      </main>
      <ApexFooter />
    </>
  );
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div className="card text-center">
      <div className="text-4xl sm:text-5xl font-black text-[color:var(--brand-pink)]">
        {big}
      </div>
      <p className="mt-2 text-[color:var(--brand-ink-muted)] text-sm leading-relaxed">
        {small}
      </p>
    </div>
  );
}

function Bullet({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 inline-block w-2 h-2 rounded-full bg-[color:var(--brand-pink)] flex-shrink-0" />
      <div>
        <strong>{title}</strong>{" "}
        <span className="text-[color:var(--brand-ink-muted)]">{body}</span>
      </div>
    </li>
  );
}
