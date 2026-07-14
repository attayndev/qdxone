import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "What is Shift-Ready Hiring™? — QDXone",
  description:
    "Shift-Ready Hiring is a different way to hire hourly restaurant staff: every applicant assessed on job-relevant qualities, scored, and ranked — so operators know who to call first.",
};

export default function ShiftReadyHiringPage() {
  return (
    <>
      <ApexHeader />
      <main className="flex-1">
        {/* ── Definition ─────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 pt-12 pb-10">
          <div className="max-w-3xl mx-auto">
            <span className="chip bg-[color:var(--brand-soft)] text-[color:var(--brand-blue-600)] mb-4">
              The category
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              What is Shift-Ready Hiring™?
            </h1>
            <p className="mt-5 text-lg text-[color:var(--brand-ink-muted)] leading-relaxed">
              <strong className="text-[color:var(--brand-ink)]">
                Shift-Ready Hiring is a way of hiring hourly restaurant staff
                where every applicant is assessed on the qualities that matter
                in the work — reliability, people skills, ownership — and the
                operator starts from a scored shortlist instead of a pile of
                applications.
              </strong>
            </p>
            <p className="mt-4 text-lg text-[color:var(--brand-ink-muted)] leading-relaxed">
              It doesn&apos;t replace job boards, and it doesn&apos;t replace
              the interview. It answers the question that sits between them:{" "}
              <em>who deserves my attention first?</em>
            </p>
          </div>
        </section>

        {/* ── Volume ≠ signal ────────────────────────────────────── */}
        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-ink)] text-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight">
              Applicant volume is not hiring signal.
            </h2>
            <div className="mt-5 space-y-4 text-white/85 text-[17px] leading-relaxed">
              <p>
                Restaurant hiring has been built around resumes, application
                inboxes, and interviews. Job boards can generate applicants —
                that part of the system works. Traditional hiring software can
                organize them into tidy columns. But neither tells the
                operator anything about who those applicants are.
              </p>
              <p>
                That&apos;s the <strong>Applicant Volume Trap</strong>: more
                applicants create more sorting, more screening calls, and more
                interviews — without necessarily creating better hires. The
                pile gets taller. The signal doesn&apos;t get stronger. And
                the operator is still left deciding who deserves an interview,
                usually between rushes.
              </p>
            </div>
          </div>
        </section>

        {/* ── Why resumes underperform ───────────────────────────── */}
        <section className="px-4 sm:px-6 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight">
              Resumes weren&apos;t built for frontline work.
            </h2>
            <p className="mt-4 text-[17px] text-[color:var(--brand-ink-muted)] leading-relaxed">
              A resume records where someone has been. For office careers,
              that history carries real information. For hourly restaurant
              work, the qualities that decide whether a hire works out —
              showing up on time, staying calm when the line is out the door,
              taking feedback, doing what needs doing without being told —
              rarely appear on paper at all. Many strong candidates are on
              their first job, or bring experience from school, caregiving, or
              a different industry entirely.
            </p>
            <p className="mt-4 text-[17px] text-[color:var(--brand-ink-muted)] leading-relaxed">
              So operators fall back on gut feel and twenty-minute interviews
              — honest tools, but inconsistent ones, and they only stretch to
              a fraction of the pile.
            </p>
          </div>
        </section>

        {/* ── Where it fits ──────────────────────────────────────── */}
        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight">
              Between the job board and the interview.
            </h2>
            <p className="mt-4 text-[17px] text-[color:var(--brand-ink-muted)] leading-relaxed">
              Shift-Ready Hiring adds one step to the hiring you already do.
              Post wherever you post today — job boards, social media, your
              website, a QR code by the register. Every applicant completes a
              mobile application and a five-minute assessment, and comes back
              scored on job-relevant qualities. The result is a shortlist
              with a clear starting point: who to call first, and what to ask
              about when you do.
            </p>
            <p className="mt-4 text-[17px] text-[color:var(--brand-ink-muted)] leading-relaxed">
              QDXone is the platform we built to make that step effortless —
              the hiring page, the application, the assessment, and the
              scored shortlist, with interview scheduling built in.
            </p>
          </div>
        </section>

        {/* ── Principles ─────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight">
              The principles behind the category.
            </h2>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <Principle
                t="Every applicant gets assessed."
                b="Signal comes from covering the whole pile, not skimming the top of it. That's why unlimited assessments aren't a premium feature — the category doesn't work without them."
              />
              <Principle
                t="Score, don't filter."
                b="Nobody is auto-rejected. QDXone evaluates job-relevant signals and ranks the list; it never makes the hiring decision for you."
              />
              <Principle
                t="Behavior beats biography."
                b="Evaluate what someone is likely to do on a shift — not where they've worked before. First-job candidates get a fair read."
              />
              <Principle
                t="Plain language, human judgment."
                b="Operators see simple bands and flags, not black-box numbers — decision support for the person who still makes every call."
              />
            </div>
            <p className="mt-6 text-sm text-[color:var(--brand-ink-muted)]">
              Fairness is part of the design: consistent questions for
              everyone, ratings instead of exact-looking scores, and built-in
              checks that flag if any group is being screened out at a lower
              rate.
            </p>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-ink)] text-white">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Stop collecting applicants. Start identifying the people most
              ready to join the shift.
            </h2>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup" className="btn-primary">
                Try Shift-Ready Hiring
              </Link>
              <Link
                href="/how-it-works"
                className="btn-ghost !text-white !border-white hover:!bg-white hover:!text-[color:var(--brand-ink)]"
              >
                See how it works
              </Link>
            </div>
          </div>
        </section>
      </main>
      <ApexFooter />
    </>
  );
}

function Principle({ t, b }: { t: string; b: string }) {
  return (
    <div className="card">
      <h3 className="font-extrabold">{t}</h3>
      <p className="text-[color:var(--brand-ink-muted)] mt-1 text-[15px] leading-relaxed">
        {b}
      </p>
    </div>
  );
}
