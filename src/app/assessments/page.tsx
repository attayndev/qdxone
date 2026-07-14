import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "Inside the five-minute assessment — QDXone",
  description:
    "Sample items and the four job-relevant categories behind QDXone's restaurant hiring assessment — the engine of Shift-Ready Hiring and the scored shortlist.",
};

const SAMPLES = [
  {
    q: "I show up on time, even when I don't feel like going.",
    why: "Attendance is the #1 operator pain, and it never appears on a resume. Dependability shows up here.",
    measures: ["Dependability"],
  },
  {
    q: "When my manager points out a mistake, I focus on fixing it instead of defending myself.",
    why: "Frontline work is one long feedback loop. Coachable hires improve fast; defensive ones don't.",
    measures: ["Coachability"],
  },
  {
    q: "When I see something that needs doing, I do it without waiting to be told.",
    why: "The difference between a hire who runs the slow Tuesday and one who stands around waiting for instructions.",
    measures: ["Initiative & Ownership"],
  },
  {
    q: "I stay calm when things get busy.",
    why: "The line gets long, a guest gets loud, the cooler dies. Composure is what guests notice — and what keeps a shift from unraveling.",
    measures: ["Composure"],
  },
  {
    q: "I want customers to leave happier than they came in.",
    why: "Frontline service is emotional labor. Genuine warmth differentiates 'fine' service from the kind guests come back for.",
    measures: ["Customer Warmth"],
  },
];

const CATEGORIES = [
  {
    name: "Reliability & Drive",
    body: "Shows up, follows through, and pushes to get better. Dependability + Achievement.",
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
    body: "Stays calm under pressure and bounces back from a bad shift without rumination.",
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
              Real statements.{" "}
              <span className="text-[color:var(--brand-blue)]">Real signal.</span>{" "}
              Not personality astrology.
            </h1>
            <p className="mt-5 text-lg text-[color:var(--brand-ink-muted)]">
              This is the engine behind the scored shortlist. Candidates rate
              short, honest statements on a 5-point scale — about five minutes
              on a phone, plus a quick motivation screener. Below are a few,
              paired with the behavior each one evaluates.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-10 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
          <div className="max-w-4xl mx-auto space-y-4">
            {SAMPLES.map((s, i) => (
              <div
                key={i}
                className="card border-l-4 border-l-[color:var(--brand-blue)]"
              >
                <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)] font-semibold">
                  Sample item {i + 1}
                </div>
                <p className="mt-2 font-black text-xl leading-snug">
                  &ldquo;{s.q}&rdquo;
                </p>
                <p className="mt-3 text-[color:var(--brand-ink-muted)] leading-relaxed text-[15px]">
                  <strong className="text-[color:var(--brand-ink)]">
                    Why we ask:
                  </strong>{" "}
                  {s.why}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.measures.map((m) => (
                    <span
                      key={m}
                      className="chip bg-white border border-[color:var(--brand-line)] text-[color:var(--brand-ink)]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Four categories.
            </h2>
            <p className="mt-3 text-lg text-[color:var(--brand-ink-muted)]">
              The qualities that matter in restaurant work — evaluated across
              eight facets and reported as plain Low / Mid / High bands, so the
              shortlist gives you a clearer starting point, not a black-box
              number.
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
              goals, and tenure expectation — reported as flags, not a score.
              Built on validated research and reviewed by a credentialed I/O
              psychologist; candidates are never auto-rejected.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              You&apos;re in control.
            </h2>
            <p className="mt-3 text-[color:var(--brand-ink-muted)]">
              The assessment is consistent for fairness, but the rest of the
              hiring flow is yours to shape:
            </p>
            <ul className="mt-4 space-y-2 text-[15px]">
              <li>✓ Define your own roles — whatever you call them.</li>
              <li>
                ✓ Choose which application fields are required, optional, or
                hidden.
              </li>
              <li>
                ✓ Auto-send the assessment, or review applications first to
                filter out joke submissions.
              </li>
              <li>
                ✓ Your branding — applicants see your restaurant&apos;s name
                and hiring page, not ours.
              </li>
            </ul>
            <p className="mt-5 text-sm text-[color:var(--brand-ink-muted)] italic">
              We deliberately don&apos;t publish the full item list or the
              scoring weights — that would let candidates game the assessment.
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
