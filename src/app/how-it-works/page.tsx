import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "How QDX works — pre-screening for restaurant hiring",
  description:
    "Send a link. Candidate takes a 5-minute behavioral assessment. You get a scored report. Decide whose interview is worth your hour.",
};

export default function HowItWorksPage() {
  return (
    <>
      <ApexHeader active="/how-it-works" />
      <main className="flex-1">
        <section className="px-4 sm:px-6 pt-12 pb-10">
          <div className="max-w-3xl mx-auto">
            <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)] mb-4">
              How it works
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              Twenty minutes from invitation to decision.
            </h1>
            <p className="mt-5 text-lg text-[color:var(--brand-ink-muted)]">
              QDX sits in front of your interview funnel. It screens
              candidates on the behaviors that decide whether they&apos;ll
              earn their shift — so the only people you sit down with are
              the ones worth your hour.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-10 border-y border-[color:var(--brand-line)] bg-[color:var(--brand-cream)]">
          <div className="max-w-4xl mx-auto space-y-6">
            <Step
              n="1"
              title="Invite the candidate"
              body="Add the candidate's name, email, and phone in the admin dashboard. We generate a unique, secure link tied to that one application. You can email it directly, copy it, or text it."
              detail="Each link expires in 30 days. Once submitted, it can't be reopened."
            />
            <Step
              n="2"
              title="They take the assessment on their phone"
              body="Branded landing → 5–7 minutes of mobile-first questions → done. No login, no download, no account creation. Most candidates finish in under six minutes."
              detail="Honest answers are the goal — the questions are written for ages 16–22 with little or no formal work history."
            />
            <Step
              n="3"
              title="You read the report"
              body="Six trait scores (reliability, coachability, ownership, rule-fit, composure, customer instincts), risk flags surfaced when answers signal concerns, and a recommendation tier — Strong Interview, Interview, Borderline, or Do Not Interview."
              detail="One-page report. No fluff. Decide who's worth the call."
            />
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight">
              What you don&apos;t do.
            </h2>
            <ul className="mt-6 space-y-3 text-lg">
              <li>❌ Burn 20 minutes on someone who was never going to show.</li>
              <li>❌ Train someone who was never going to follow a rule.</li>
              <li>❌ Cover a Saturday because someone called out by week two.</li>
              <li>❌ Read 40 résumés that all say the same thing.</li>
              <li>❌ Run personality tests that profile vibes instead of work.</li>
            </ul>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-ink)] text-white">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready to skip the bad interviews?
            </h2>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup" className="btn-primary">
                Start a 7-day trial
              </Link>
              <Link
                href="/assessments"
                className="btn-ghost !text-white !border-white hover:!bg-white hover:!text-[color:var(--brand-ink)]"
              >
                See sample questions
              </Link>
            </div>
          </div>
        </section>
      </main>
      <ApexFooter />
    </>
  );
}

function Step({
  n,
  title,
  body,
  detail,
}: {
  n: string;
  title: string;
  body: string;
  detail: string;
}) {
  return (
    <div className="card flex gap-4 sm:gap-6">
      <div className="flex-shrink-0 w-12 sm:w-16">
        <div className="text-5xl font-black text-[color:var(--brand-pink)] leading-none">
          {n}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-black text-xl sm:text-2xl tracking-tight">
          {title}
        </h3>
        <p className="mt-2 text-[color:var(--brand-ink-muted)] text-[16px] leading-relaxed">
          {body}
        </p>
        <p className="mt-2 text-sm text-[color:var(--brand-ink-muted)] italic">
          {detail}
        </p>
      </div>
    </div>
  );
}
