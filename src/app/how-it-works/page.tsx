import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "How QDX works — restaurant hiring, end to end",
  description:
    "Post a role, candidates apply and take a 5-minute assessment on their phone, and you get a scored shortlist with bands and a fit recommendation.",
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
              Post a role. Get a scored shortlist.
            </h1>
            <p className="mt-5 text-lg text-[color:var(--brand-ink-muted)]">
              QDX is your whole top-of-funnel — the hiring page, the
              application, and the assessment. Candidates apply from their
              phone, and the only people you sit down with are the ones worth
              your hour.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-10 border-y border-[color:var(--brand-line)] bg-[color:var(--brand-cream)]">
          <div className="max-w-4xl mx-auto space-y-6">
            <Step
              n="1"
              title="Post the role"
              body="Pick a role you've defined (Team Member, Shift Lead, whatever you call them) and QDX gives you a shareable link plus a QR code for your counter, window, or socials. You control the application fields and your own roles."
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
              <li>❌ Auto-reject anyone — QDX recommends, you decide.</li>
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
                Start free
              </Link>
              <Link
                href="/assessments"
                className="btn-ghost !text-white !border-white hover:!bg-white hover:!text-[color:var(--brand-ink)]"
              >
                See sample items
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
