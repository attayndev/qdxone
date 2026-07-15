import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "Inside the five-minute assessment — QDXone",
  description:
    "What QDXone's restaurant hiring assessment measures, how plain-English bands are produced, and what it surfaces before you spend an hour interviewing.",
};

// Illustrative items written for this page — deliberately NOT drawn from
// the live item bank, and never labeled with the construct they resemble
// (publishing live items or item→construct maps would enable coaching).
const SAMPLES = [
  "If I say I'll cover a shift, I'm there — even when something better comes up.",
  "When we're slammed, I'd rather hear I'm doing something wrong than keep doing it wrong.",
  "If the dining room's a mess and it's nobody's job, it's my job.",
];

// Each pain an operator already recognizes → what the assessment surfaces
// before the interview. The last one deliberately cuts the other way.
const PAINS = [
  {
    t: "Great interview, empty Saturday shift.",
    b: "The motivation screener flags past attendance and how long someone expects to stay — before you meet them.",
  },
  {
    t: "Bristles at every correction.",
    b: "Openness to coaching shows up in People Skills — you'll know what to probe.",
  },
  {
    t: "Never planned to stay past training.",
    b: "Goals and tenure expectation come back as flags worth asking about.",
  },
  {
    t: "The thin resume hiding your best worker.",
    b: "First job, caregiver, career-switcher — they get scored on behaviors, not history. A resume screen misses them.",
  },
];

const CATEGORIES = [
  {
    name: "Reliability & Drive",
    body: "Shows up Friday night even when they don't feel like it, and pushes to get better. The difference between a covered schedule and covering it yourself.",
  },
  {
    name: "People Skills",
    body: "Warm with a stressed guest, easy with the crew, and doesn't bristle when you correct the register count.",
  },
  {
    name: "Ownership",
    body: "Sees the dining room's a mess and handles it — nobody told them, and it wasn't “their job.”",
  },
  {
    name: "Composure",
    body: "The line's out the door and the POS just froze. Some people steady; some unravel.",
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
              You&apos;ve hired the great interview who stopped showing up by
              week three. What decides that was never on the resume — so this
              is where we measure it: five minutes on the applicant&apos;s
              phone, before you commit your hour. Here&apos;s what it looks
              for, and how to read it.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight">
              What five minutes surfaces that a resume can&apos;t.
            </h2>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {PAINS.map((p) => (
                <div
                  key={p.t}
                  className="card border-l-4 border-l-[color:var(--brand-amber)]"
                >
                  <h3 className="font-black text-lg leading-snug">{p.t}</h3>
                  <p className="text-[color:var(--brand-ink-muted)] mt-1.5 text-[15px] leading-relaxed">
                    {p.b}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-10 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-[color:var(--brand-ink-muted)] mb-4">
              These examples are written for this page — same style and
              reading level, but not drawn from the live assessment, which
              uses a larger, rotating set.
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
              Four categories — each one on an actual shift.
            </h2>
            <p className="mt-3 text-lg text-[color:var(--brand-ink-muted)]">
              Every statement feeds one of four categories, reported as plain
              Low / Mid / High bands — here&apos;s each on a shift:
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
              A separate five-item motivation screener captures past
              attendance, goals, and tenure expectation — flags to raise in
              the interview, not a score.
            </p>

            <div className="mt-6 card bg-[color:var(--brand-soft)] border-[color:var(--brand-blue)]/30">
              <div className="text-xs uppercase tracking-wider text-[color:var(--brand-blue-600)] font-semibold">
                The foundation
              </div>
              <p className="mt-1.5 text-[15px] leading-relaxed">
                Job-relevant behaviors and motivation — not personality types
                or labels. Built on established personality and motivation
                research; framework reviewed by a credentialed I/O
                psychologist.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              You&apos;re in control.
            </h2>
            <p className="mt-3 text-[color:var(--brand-ink-muted)]">
              The assessment is consistent for everyone; the rest of the flow
              is yours — your roles, your application fields, auto-send or
              review-first, your branding. We deliberately don&apos;t publish
              the live item list or scoring weights — that would hand
              candidates the answer key.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Bands, not black boxes.
            </h2>
            <p className="mt-3 text-[color:var(--brand-ink-muted)]">
              Answers across many statements combine into a Low / Mid / High
              band per category — no single item determines a band. Bands are
              deliberately coarse:
              these measures aren&apos;t precise to the decimal, and coarse
              bands keep small differences from being over-read.
            </p>
            <p className="mt-3 text-[color:var(--brand-ink-muted)]">
              Can it be gamed? No assessment is game-proof, and we won&apos;t
              pretend otherwise. But faking a consistent story across many
              statements is harder than nailing one interview answer, and
              quality checks — attention items and response-time flags — mark
              rushed or careless runs. It&apos;s one input — you make every
              hiring decision.
            </p>
            <p className="mt-8 text-2xl sm:text-3xl font-black tracking-tight leading-snug text-center">
              The interview is where you verify.
              <br />
              <span className="text-[color:var(--brand-blue)]">
                The assessment tells you what to verify.
              </span>
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-ink)] text-white">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Spend your interview hour where it counts.
            </h2>
            <p className="mt-4 text-white/80 max-w-xl mx-auto">
              Five minutes from every applicant — so your time goes to the
              people most ready to join the shift.
            </p>
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
