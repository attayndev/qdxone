import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";
import { ROOT_DOMAIN } from "@/lib/host";

export const metadata = {
  title: "How Shift-Ready Hiring™ works — QDXone",
  description:
    "Post a role, every applicant completes a mobile application and a five-minute assessment, and you get a scored shortlist — so you know who to call first.",
};

export default function HowItWorksPage() {
  return (
    <>
      <ApexHeader active="/how-it-works" />
      <main className="flex-1">
        <section className="px-4 sm:px-6 pt-12 pb-10">
          <div className="max-w-3xl mx-auto">
            <span className="chip bg-[color:var(--brand-soft)] text-[color:var(--brand-blue-600)] mb-4">
              How Shift-Ready Hiring™ works
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              Post a role. Get a scored shortlist.
            </h1>
            <p className="mt-5 text-lg text-[color:var(--brand-ink-muted)]">
              QDXone is the hiring page, the application, and the five-minute
              assessment. Candidates apply from their phone, every applicant
              gets assessed, and you start from a shortlist instead of an
              inbox — knowing who to call first.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-10 border-y border-[color:var(--brand-line)] bg-[color:var(--brand-cream)]">
          <div className="max-w-4xl mx-auto space-y-6">
            <Step
              n="1"
              title="Post the role"
              body="Pick a role you've defined (Team Member, Shift Lead, whatever you call them) and QDXone gives you a shareable link plus a QR code for your counter, window, or socials. You control the application fields and your own roles."
              detail="No job board fees. Candidates land on your branded hiring page."
            />
            <Step
              n="2"
              title="They apply and take a 5-minute assessment"
              body="A short, mobile-first application, then a 5-minute assessment — plain-language statements rated on a 5-point scale, written at a 6th-grade reading level. No login, no download. About 8 minutes total, and they can pick up where they left off for 72 hours."
              detail="Quiet quality checks (attention items, response timing) keep the results trustworthy."
            />
            <Step
              n="3"
              title="You get a scored shortlist"
              body="Each candidate comes back with verbal bands across four categories — Reliability & Drive, People Skills, Ownership, Composure — an overall fit recommendation (Strong fit, Consider, Caution, Not recommended), and screener flags like past attendance and tenure expectation."
              detail="Bands, not black-box numbers. Recommendations are decision support — you make every call."
            />
            <Step
              n="4"
              title="Invite your top pick to interview"
              body="Send a booking link by text or email — the candidate picks an open time straight from your calendar, no phone tag. Confirmations and reminders go out on their own, and it can sync with your Google Calendar."
              detail="Optional. Set your interview types and availability once; candidates self-book from there."
            />
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight">
              What you don&apos;t do.
            </h2>
            <ul className="mt-6 space-y-3 text-lg">
              <li>❌ Read 40 resumes that all say the same thing.</li>
              <li>❌ Sort an inbox by gut feel between rushes.</li>
              <li>❌ Burn 20 minutes on someone who was never going to show.</li>
              <li>❌ Start the interview with zero idea what to ask about.</li>
              <li>❌ Auto-reject anyone — QDXone recommends, you decide.</li>
            </ul>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-ink)] text-white">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready to know who to call first?
            </h2>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup" className="btn-primary">
                Start free
              </Link>
              <a
                href={`https://demo.${ROOT_DOMAIN}`}
                className="btn-ghost !text-white !border-white hover:!bg-white hover:!text-[color:var(--brand-ink)]"
              >
                See the live demo
              </a>
              <Link
                href="/assessments"
                className="btn-ghost !text-white !border-white hover:!bg-white hover:!text-[color:var(--brand-ink)]"
              >
                Sample Questions
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
        <div className="text-5xl font-black text-[color:var(--brand-blue)] leading-none">
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
