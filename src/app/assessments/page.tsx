import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "Inside the five-minute assessment — QDXone",
  description:
    "What QDXone's restaurant hiring assessment measures, how plain-English bands are produced, and why gaming it is hard — the engine behind the scored shortlist.",
};

// Illustrative items written for this page — deliberately NOT drawn from
// the live item bank, and never labeled with the construct they resemble
// (publishing live items or item→construct maps would enable coaching).
const SAMPLES = [
  "If I say I'll cover a shift, I'm there — even when something better comes up.",
  "When we're slammed, I'd rather hear I'm doing something wrong than keep doing it wrong.",
  "If the dining room's a mess and it's nobody's job, it's my job.",
];

const CATEGORIES = [
  {
    name: "Reliability & Drive",
    body: "Shows up, follows through, and pushes to get better.",
  },
  {
    name: "People Skills",
    body: "Customer warmth, team cooperation, and openness to coaching. The behaviors guests and crew feel.",
  },
  {
    name: "Ownership",
    body: "Believes effort drives outcomes, and acts on it — owning mistakes and self-starting.",
  },
  {
    name: "Composure",
    body: "Stays calm under pressure and bounces back from a bad shift.",
  },
];

export default function AssessmentsPage() {
  return (
    <>
      <ApexHeader active="/assessments" />
      <main className="flex-1">
        <section className="px-4 sm:px-6 pt-12 pb-10">
          <div className="max-w-3xl mx-auto">
            <span className="chip bg-[color:var(--brand-soft)] text-[color:var(--brand-blue-600)] mb-4">
              The five-minute assessment
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              Short statements.{" "}
              <span className="text-[color:var(--brand-blue)]">
                Straight answers.
              </span>
            </h1>
            <p className="mt-5 text-lg text-[color:var(--brand-ink-muted)]">
              This is the engine behind the scored shortlist. Candidates rate
              short, plain-language statements on a 5-point scale — about five
              minutes on a phone, plus a quick motivation screener. Here&apos;s
              what it measures, how results come back, and why it&apos;s hard
              to game.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-10 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-[color:var(--brand-ink-muted)] mb-4">
              The examples below are written for this page — they show the
              style and reading level, but they aren&apos;t drawn from the
              live assessment, which uses a larger, rotating set of
              statements.
            </p>
            <div className="space-y-4">
              {SAMPLES.map((q, i) => (
                <div
                  key={i}
                  className="card border-l-4 border-l-[color:var(--brand-blue)]"
                >
                  <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)] font-semibold">
                    Example item {i + 1}
                  </div>
                  <p className="mt-2 font-black text-xl leading-snug">
                    &ldquo;{q}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Four categories.
            </h2>
            <p className="mt-3 text-lg text-[color:var(--brand-ink-muted)]">
              Every statement feeds one of four categories — the qualities
              that matter in restaurant work — reported as plain Low / Mid /
              High bands.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {CATEGORIES.map((t) => (
                <div key={t.name} className="card">
                  <h3 className="font-extrabold">{t.name}</h3>
                  <p className="text-[color:var(--brand-ink-muted)] mt-1 text-[15px] leading-relaxed">
                    {t.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-[color:var(--brand-ink-muted)]">
              A separate 5-item motivation screener captures past attendance,
              goals, and tenure expectation — reported as flags to raise in
              the interview, not a score. QDXone is a personality-based
              assessment built for restaurant work: job-relevant behaviors,
              not personality types. The framework is built on validated
              personality and motivation research and reviewed by a
              credentialed I/O psychologist. No candidate is ever
              auto-rejected — a person makes every hiring decision.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Bands, not black boxes.
            </h2>
            <p className="mt-3 text-[color:var(--brand-ink-muted)]">
              Answers across many statements are combined into a Low / Mid /
              High band per category — never a single magic number, and never
              a pass/fail. Bands are deliberately coarse: these measures
              aren&apos;t precise to the decimal, and coarse bands keep small
              differences from being over-read.
            </p>
            <p className="mt-3 text-[color:var(--brand-ink-muted)]">
              Gaming is harder than it looks. There&apos;s no obvious
              &ldquo;right&rdquo; answer pattern across the set, and quiet
              quality checks — attention items and response-time flags — mark
              results that look rushed or inattentive, so you can weigh them
              accordingly. And because the result is a starting point for an
              interview with a person — not an automated decision — someone
              who games their way to a band still has to back it up face to
              face.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              You&apos;re in control.
            </h2>
            <p className="mt-3 text-[color:var(--brand-ink-muted)]">
              The assessment is consistent for everyone, but the rest of the
              hiring flow is yours to shape:
            </p>
            <ul className="mt-4 space-y-2 text-[15px]">
              <li>✓ Define your own roles — whatever you call them.</li>
              <li>
                ✓ Choose which application fields are required, optional, or
                hidden.
              </li>
              <li>✓ Auto-send the assessment, or review applications first.</li>
              <li>
                ✓ Your branding — applicants see your restaurant&apos;s name
                and hiring page, not ours.
              </li>
            </ul>
            <p className="mt-5 text-sm text-[color:var(--brand-ink-muted)] italic">
              We deliberately don&apos;t publish the live item list or the
              scoring weights — that would let candidates game the
              assessment.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-ink)] text-white">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              See it on a real candidate.
            </h2>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup" className="btn-primary">
                Start free
              </Link>
              <Link
                href="/demo"
                className="btn-ghost !text-white !border-white hover:!bg-white hover:!text-[color:var(--brand-ink)]"
              >
                Book a 15-min demo
              </Link>
            </div>
          </div>
        </section>
      </main>
      <ApexFooter />
    </>
  );
}
