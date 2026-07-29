import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "QDXone for independent & owner-operated restaurants",
  description:
    "When you don't have HR, you have an inbox and a gut feeling. QDXone assesses every applicant and hands you a scored shortlist as your starting point.",
};

export default function ForIndependentsPage() {
  return (
    <>
      <ApexHeader active="/for-independents" />
      <main className="flex-1">
        <section className="px-4 sm:px-6 pt-12 pb-10">
          <div className="max-w-3xl mx-auto">
            <span className="chip bg-[color:var(--brand-soft)] text-[color:var(--brand-blue-600)] mb-4">
              For independent & owner-operated
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              You don&apos;t have HR.{" "}
              <span className="text-[color:var(--brand-blue)]">
                You have a gut feeling.
              </span>
            </h1>
            <p className="mt-5 text-lg text-[color:var(--brand-ink-muted)]">
              When you&apos;re running the floor, the office, the schedule,
              and the hiring, the Applicant Volume Trap hits hardest — you
              are the one sorting the inbox. QDXone assesses every applicant
              before you sit down with anyone, so interview time goes to the
              people most ready to join the shift.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              The owner-operator hiring trap.
            </h2>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <Trap
                t="You're the recruiter."
                b="Posting the ad, reading the replies, chasing the no-shows. All while running prep and covering the line."
              />
              <Trap
                t="You're the interviewer."
                b="20 minutes per applicant — and the ones who wash out take a week of training with them."
              />
              <Trap
                t="You're the trainer."
                b="A week of your time goes into someone, then they ghost you on a Saturday."
              />
              <Trap
                t="You're the cover."
                b="When a hire washes out, who's behind the counter? You are."
              />
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight">
              QDXone gives you signal before you spend time.
            </h2>
            <ul className="mt-6 space-y-4 text-[16px] leading-relaxed">
              <Bullet>
                <strong>Post once, assess on autopilot.</strong> Share a link
                or QR code. Candidates apply and take a five-minute assessment
                on their phone — you just open the scored shortlist.
              </Bullet>
              <Bullet>
                <strong>Works for part-time and full-time hires.</strong> Plain
                language, no assumption of a formal work history — whether
                someone wants a few shifts a week or a full-time job, first job
                or fifteenth. Past work, school, military, caregiving, and
                volunteering all count.
              </Bullet>
              <Bullet>
                <strong>Flags tell you what to ask about.</strong> Past
                attendance, tenure expectation, quality concerns. You walk
                into the interview with a real agenda.
              </Bullet>
              <Bullet>
                <strong>Your brand, not ours.</strong>&nbsp;The applicant sees your
                restaurant&apos;s name and your wording. And nobody gets
                auto-rejected — every decision is yours.
              </Bullet>
              <Bullet>
                <strong>It doesn&apos;t stop at the hire.</strong>&nbsp;The
                same platform builds your weekly schedule and keeps track of
                your team&apos;s performance, so running the shift and running
                the hiring finally live in one place instead of a separate
                app for each.
              </Bullet>
            </ul>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-ink)] text-white">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Try it on your next applicant.
            </h2>
            <p className="mt-4 text-white/80">
              30-day free trial. Solo is $79 a month per location after that.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup" className="btn-primary">
                Start free
              </Link>
              <Link
                href="/pricing"
                className="btn-ghost !text-white !border-white hover:!bg-white hover:!text-[color:var(--brand-ink)]"
              >
                See pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
      <ApexFooter />
    </>
  );
}

function Trap({ t, b }: { t: string; b: string }) {
  return (
    <div className="card">
      <h3 className="font-extrabold">{t}</h3>
      <p className="text-[color:var(--brand-ink-muted)] mt-1 text-[15px] leading-relaxed">
        {b}
      </p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 inline-block w-2 h-2 rounded-full bg-[color:var(--brand-blue)] flex-shrink-0" />
      <div>{children}</div>
    </li>
  );
}
