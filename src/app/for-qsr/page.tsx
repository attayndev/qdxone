import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "QDX for multi-unit & franchise restaurants",
  description:
    "Standardize hiring across every location. One scored signal so a strong candidate at one restaurant looks strong at all of them.",
};

export default function ForMultiUnitPage() {
  return (
    <>
      <ApexHeader active="/for-qsr" />
      <main className="flex-1">
        <section className="px-4 sm:px-6 pt-12 pb-10">
          <div className="max-w-3xl mx-auto">
            <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)] mb-4">
              For multi-unit & franchise
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              Standardize how you hire.{" "}
              <span className="text-[color:var(--brand-pink)]">
                Across every location.
              </span>
            </h1>
            <p className="mt-5 text-lg text-[color:var(--brand-ink-muted)]">
              Frontline turnover is brutal and manager hours are scarce —
              whether it&apos;s a fast-casual counter or a full-service floor.
              QDX gives every location the same hiring page, the same scoring,
              and the same recommendation logic, so a strong candidate at one
              restaurant looks like a strong candidate at all of them.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center">
              The restaurant hiring math.
            </h2>
            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              <Stat big="20+" small="minutes per interview, multiplied by every weak applicant your managers sat with this week." />
              <Stat big="60–100%" small="annual turnover in many restaurant concepts. Bad first hires drive bad second hires." />
              <Stat big="$3–5K" small="commonly cited cost of one frontline hire that washes out in 30 days." />
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight">
              What changes when QDX handles your applications.
            </h2>
            <ul className="mt-6 space-y-4 text-[16px] leading-relaxed">
              <Bullet
                title="Manager time goes back where it belongs."
                body="Your managers stop interviewing applicants who would have walked out by week two. The interviews they do run are with candidates that already cleared a scored bar."
              />
              <Bullet
                title="Hiring quality stops being a personality lottery."
                body="Different locations, different managers, different instincts. QDX gives every restaurant the same scored signal so the bar doesn't drift store to store."
              />
              <Bullet
                title="A fairer, more defensible process."
                body="The same assessment for everyone, clear Low/Medium/High ratings instead of gut calls, and built-in fairness checks. No applicant is ever turned down by the system — the ratings support your managers, they don't overrule them."
              />
              <Bullet
                title="Hire the behaviors guests notice."
                body="Reliability, people skills, ownership, composure — the things that show up at the counter and on the floor. Hire them in instead of trying to coach them in."
              />
            </ul>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-ink)] text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Running more than one location?
            </h2>
            <p className="mt-4 text-white/80">
              Operator is self-serve for two or more stores — one account across
              every location, a shared hiring page, and reports that compare your
              stores. $79 a location, dropping to $69 once you pass 10. Running a
              brand, or several brands? Enterprise is custom — let&apos;s talk.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/pricing" className="btn-primary">
                See pricing
              </Link>
              <Link
                href="/demo"
                className="btn-ghost !text-white !border-white hover:!bg-white hover:!text-[color:var(--brand-ink)]"
              >
                Talk to us
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
