import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "What QDX measures — a look inside the assessment",
  description:
    "Sample questions and the trait map behind QDX's behavioral pre-screening. Real questions, real signal, not personality astrology.",
};

const SAMPLES = [
  {
    q: "When work is slow, what do you usually do?",
    why: "Frontline jobs aren't just about the rush. The way someone handles a slow Tuesday tells you whether they'll wipe down the counter, restock, prep, study the menu — or stand around waiting to be told.",
    measures: ["Initiative", "Productive without supervision"],
  },
  {
    q: "How do you usually respond when a manager corrects you?",
    why: "Frontline jobs are 80% feedback loop. Defensive hires don't improve. We screen for candidates who can hear a correction without blowing up or shutting down.",
    measures: ["Coachability", "Defensiveness"],
  },
  {
    q: "What does being on time mean to you?",
    why: "There's a difference between \"I show up at 4:00 because I'm on the schedule for 4:00\" and \"I'm there at 3:50, ready to go.\" Both call themselves on time. Only one will protect your shift.",
    measures: ["Reliability", "Punctuality mindset"],
  },
  {
    q: "A customer is upset, and honestly it isn't really your fault. What do you do?",
    why: "The instinct to apologize and make it right is often there or it isn't. We find out before you do.",
    measures: ["Customer instincts", "Ownership"],
  },
  {
    q: "Tell me about a rule at school, work, or on a team that you didn't love but still followed. Why did you stick with it?",
    why: "Restaurants run on rules — health code, cash handling, phone policy. Candidates who can articulate why a rule exists are usually the ones who follow it.",
    measures: ["Rule-fit", "Maturity"],
  },
];

const TRAITS = [
  {
    name: "Reliability",
    body: "Shifts without the right number of bodies are shifts that break.",
  },
  {
    name: "Coachability",
    body: "Frontline jobs are 80% feedback-loop. Defensive hires don't improve.",
  },
  {
    name: "Ownership",
    body: "Owners look for fixes; non-owners look for someone to blame.",
  },
  {
    name: "Rule-fit",
    body: "Health code, cash handling, phone policy. Rules aren't optional.",
  },
  {
    name: "Composure",
    body: "The line gets long. The customer gets loud. The cooler dies.",
  },
  {
    name: "Customer instincts",
    body: "\"Sorry about that, let me make it right\" is a learnable behavior — but you'd rather hire it.",
  },
];

export default function AssessmentsPage() {
  return (
    <>
      <ApexHeader active="/assessments" />
      <main className="flex-1">
        <section className="px-4 sm:px-6 pt-12 pb-10">
          <div className="max-w-3xl mx-auto">
            <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)] mb-4">
              Inside the assessment
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              Real questions.{" "}
              <span className="text-[color:var(--brand-pink)]">Real signal.</span>{" "}
              Not personality astrology.
            </h1>
            <p className="mt-5 text-lg text-[color:var(--brand-ink-muted)]">
              Below are five of the questions a candidate sees, paired with
              the behavior each one is measuring. The full assessment runs
              5–7 minutes on a phone.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-10 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
          <div className="max-w-4xl mx-auto space-y-4">
            {SAMPLES.map((s, i) => (
              <div
                key={i}
                className="card border-l-4 border-l-[color:var(--brand-pink)]"
              >
                <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)] font-semibold">
                  Sample question {i + 1}
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
              The trait map.
            </h2>
            <p className="mt-3 text-lg text-[color:var(--brand-ink-muted)]">
              Six categories, each tied to behaviors that decide whether a
              hire will earn their shift.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {TRAITS.map((t) => (
                <div key={t.name} className="card">
                  <h3 className="font-extrabold">{t.name}</h3>
                  <p className="text-[color:var(--brand-ink-muted)] mt-1 text-[15px] leading-relaxed">
                    {t.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Tailored to your concept.
            </h2>
            <p className="mt-3 text-[color:var(--brand-ink-muted)]">
              The default screen is built around frontline restaurant
              behaviors. Operators can customize:
            </p>
            <ul className="mt-4 space-y-2 text-[15px]">
              <li>
                ✓ Specific rules — phone-on-the-floor, cash-handling, alcohol
                service.
              </li>
              <li>
                ✓ Wording for your concept — &ldquo;froyo shop,&rdquo;
                &ldquo;coffee bar,&rdquo; &ldquo;sandwich line.&rdquo;
              </li>
              <li>
                ✓ Phrasing of your hero copy and welcome message — applicants
                see your brand, not ours.
              </li>
              <li>
                ✓ Add-on test types (cashier math, IQ, more on the way) for
                roles where skills matter beyond behavior.
              </li>
            </ul>
            <p className="mt-5 text-sm text-[color:var(--brand-ink-muted)] italic">
              We deliberately don&apos;t publish the full question list or the
              scoring weights — that would let candidates game the test. Once
              you sign up, your admin dashboard shows the entire screen and
              the per-question logic.
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
                Start a 7-day trial
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
