import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "QDXone for multi-unit & franchise restaurants",
  description:
    "Shift-Ready Hiring across every location: every applicant assessed, the same plain-English bands at every store, so a strong candidate at one restaurant looks strong at all of them.",
};

export default function ForMultiUnitPage() {
  return (
    <>
      <ApexHeader active="/for-qsr" />
      <main className="flex-1">
        <section className="px-4 sm:px-6 pt-12 pb-10">
          <div className="max-w-3xl mx-auto">
            <span className="chip bg-[color:var(--brand-soft)] text-[color:var(--brand-blue-600)] mb-4">
              For multi-unit & franchise
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              Standardize how you hire.{" "}
              <span className="text-[color:var(--brand-blue)]">
                Across every location.
              </span>
            </h1>
            <p className="mt-5 text-lg text-[color:var(--brand-ink-muted)]">
              The Applicant Volume Trap compounds across locations: every store
              collects applications, and every manager sorts them differently.
              QDXone gives every location the same hiring page, the same
              five-minute assessment, and the same bands — so a strong
              candidate at one restaurant looks strong at all of them.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center">
              The restaurant hiring math.
            </h2>
            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              <Stat big="20 min" small="of manager time per interview — multiplied by every weak applicant your managers sat with this week." />
              <Stat big="Nonstop" small="frontline turnover means hiring never really ends — and a bad first hire restarts the clock." />
              <Stat big="Twice" small="the most expensive hire is the one you make twice: training hours, re-posting, and covered shifts, all over again." />
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight">
              What changes when QDXone handles your applications.
            </h2>
            <ul className="mt-6 space-y-4 text-[16px] leading-relaxed">
              <Bullet
                title="Manager time goes back where it belongs."
                body="Less time sorting applicants, more time running the floor. The interviews your managers do run start from a scored shortlist, with flags worth asking about."
              />
              <Bullet
                title="Hiring quality stops being a personality lottery."
                body="Different locations, different managers, different instincts. QDXone gives every restaurant the same bands so the bar doesn't drift store to store."
              />
              <Bullet
                title="A consistent process you can stand behind."
                body="The same assessment for everyone, plain Low/Mid/High bands instead of gut calls, and built-in checks that flag if any group is being screened out at a lower rate. No applicant is ever turned down by the system — a person makes every hiring decision."
              />
              <Bullet
                title="Hire the behaviors guests notice."
                body="Reliability, people skills, ownership, composure — the things that show up at the counter and on the floor. Hire them in instead of trying to coach them in."
              />
            </ul>
          </div>
        </section>

        {/* [HIDDEN UNTIL ASSET EXISTS — PROOF: MULTI-LOCATION OPERATOR]
            Case block (locations count, applicants assessed, operator's own
            words) goes here. Spec: docs/site-strengthening/06-for-qsr.md +
            appendix-b #1. */}

        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-ink)] text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Running more than one location?
            </h2>
            <p className="mt-4 text-white/80">
              Operator is self-serve for two or more stores — one account across
              every location, a shared hiring page, reports that compare your
              stores, and unlimited assessments. $79 for your first location,
              $50 for each additional. Running a brand, or several brands?
              Enterprise is custom — let&apos;s talk.
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
      <div className="text-4xl sm:text-5xl font-black text-[color:var(--brand-blue)]">
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
      <span className="mt-2 inline-block w-2 h-2 rounded-full bg-[color:var(--brand-blue)] flex-shrink-0" />
      <div>
        <strong>{title}</strong>{" "}
        <span className="text-[color:var(--brand-ink-muted)]">{body}</span>
      </div>
    </li>
  );
}
