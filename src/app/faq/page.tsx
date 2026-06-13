import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "QDX One — Operator FAQs",
  description:
    "Answers to the questions restaurant operators ask about QDX One: how it works, how it compares, the candidate experience, fairness, accounts, pricing, and setup.",
};

type Item = { q: string; a: React.ReactNode };
type Section = { title: string; items: Item[] };

const SAMPLE = (
  <Link href="/assessments" className="underline text-[color:var(--brand-pink-600)]">
    See sample items →
  </Link>
);

const SECTIONS: Section[] = [
  {
    title: "The basics",
    items: [
      {
        q: "What is QDX One?",
        a: "QDX One is a hiring and screening platform built for quick-service restaurants. You post your roles, candidates apply through your branded hiring page, and each applicant takes a short validated assessment automatically. You get back a ranked pipeline with clear strengths and fit signals on every candidate, so you spend your time on the right people. You always make the hiring decision — QDX scores candidates, it doesn't filter them.",
      },
      {
        q: "Why use QDX instead of just interviewing myself?",
        a: "You already know how to read people — QDX just makes sure you're reading the right ones. A 15-minute interview is a thin, inconsistent signal on the things that actually predict whether someone shows up and takes ownership, and you can't interview every applicant when you're busy. QDX gives you a consistent read on everyone who applies before you spend a minute of interview time, so you walk in already knowing who's worth the conversation. It doesn't make the call for you — it focuses your judgment.",
      },
      {
        q: "I'm short-staffed — won't this slow me down?",
        a: "It's built for exactly that situation. The assessment fires automatically the moment someone applies, the candidate finishes it on their phone, and you get a ranked dashboard instead of a pile of resumes to dig through. You spend your limited time interviewing only the people who already clear your bar — which speeds up time-to-hire rather than adding a step.",
      },
      {
        q: "Does it replace the interview?",
        a: "No — it's a pre-interview screen. It surfaces signals (bands across reliability, people skills, ownership, and composure, plus motivation) so you go into the interview knowing what to probe and where to push. You still meet the person, and you still make the decision. The platform scores; it doesn't filter.",
      },
    ],
  },
  {
    title: "How it compares",
    items: [
      {
        q: "How is this different from a job board like Indeed?",
        a: "They do different jobs. Indeed and other boards get applicants in the door — that's sourcing. QDX is what happens next: it takes those applicants, screens them, and ranks them so you know who to focus on. It sits on top of your job board rather than competing with it — post the role wherever you like, and QDX handles intake and screening once people apply.",
      },
      {
        q: "How is this different from a personality test?",
        a: (
          <>
            A personality test hands you a profile and stops there. QDX is built
            around hiring decisions in quick-service specifically: the traits we
            measure were chosen because they predict outcomes that matter in a
            restaurant — reliability, people skills, ownership, composure — and we
            add a short motivation screen on top. It&apos;s wired into your hiring
            flow, reports in plain Low/Mid/High bands instead of false-precision
            numbers, and monitors for adverse impact in the background. {SAMPLE}
          </>
        ),
      },
    ],
  },
  {
    title: "The candidate experience",
    items: [
      {
        q: "How long does it take a candidate?",
        a: "About five minutes, on a phone, right after they apply.",
      },
      {
        q: "What does the assessment actually look like?",
        a: (
          <>
            It&apos;s a short set of questions a candidate answers on their phone
            in about five minutes — mostly quick situational items where they pick
            how they&apos;d respond, on a simple scale. There are no trick
            questions and no obvious right answers, and it&apos;s written in plain
            language that works for the whole applicant pool. You can preview the
            exact items yourself: {SAMPLE}
          </>
        ),
      },
      {
        q: "Is it available in Spanish? What if a candidate struggles with English?",
        a: "Today the assessment is in English, written in plain, everyday language at an accessible reading level so it works across your applicant pool. Spanish-language support is on our roadmap — if it matters for your stores, tell us and we'll prioritize it.",
      },
      {
        q: "Will requiring an assessment scare off applicants?",
        a: "It's designed not to. The assessment is about five minutes, runs on a phone, and happens right after someone applies — so it never sits between an applicant and hitting “apply.” Because it's short and low-friction, most candidates complete it, and the ones who do are showing a little follow-through before you've spent any time. The goal is to raise the quality of who you talk to without shrinking the top of your funnel.",
      },
      {
        q: "Can candidates fake or game the assessment?",
        a: "No assessment is perfectly fake-proof, but this one is built to make gaming hard. Questions are designed so there's no obvious “right” answer, and the platform reads patterns across many items rather than trusting any single response. You see results as bands plus a fit signal, not a pass/fail — so a candidate who tries to game one area still gets a rounded picture, and you're always making the final call in person.",
      },
      {
        q: "Do candidates see their own results?",
        a: "No — results go to you, not the candidate. Candidates complete the assessment as part of applying and don't receive a score or band.",
      },
    ],
  },
  {
    title: "Reading the results",
    items: [
      {
        q: "Do I get one overall score, or a recommendation?",
        a: "You get verbal bands (Low / Mid / High) across the traits we measure, plus an overall fit recommendation — not a single raw number. We use bands instead of precise scores on purpose: personality measures carry real margin of error, and bands keep you from over-reading small differences. Treat the fit recommendation as a starting point, not a verdict.",
      },
      {
        q: "Should I just hire everyone in the High band?",
        a: "No — and the platform is built to discourage that. High bands point you toward strong candidates, but a band is a screen, not a ranking of someone's worth, and a great hire can land in the Mid range on a given trait. Use the bands to decide who to interview and what to dig into, then make the call the way you always have.",
      },
      {
        q: "What if my gut disagrees with the assessment?",
        a: "Trust your gut — it's your decision. The assessment is one more data point, not an override. When a candidate's bands and your read of them diverge, that's a useful thing to probe in the interview, not a reason to ignore what you saw in person. The platform exists to inform your judgment, never to replace it.",
      },
    ],
  },
  {
    title: "Fairness & compliance",
    items: [
      {
        q: "Is it fair? What about bias?",
        a: "Fairness is designed in, not bolted on. Every decision stays with a human — the platform never auto-rejects anyone. Results come back in bands rather than precise scores so no one over-reads small differences, the questions are job-relevant with EEOC-safe framings, and automatic 4/5ths adverse-impact flags plus a voluntary EEO questionnaire let you see whether any group is being screened out. When you benchmark your own team, there are safeguards so you're not simply cloning your current staff as the “ideal” hire. No tool is bias-proof, but this one is built to surface and track bias rather than hide it.",
      },
      {
        q: "Will this get me sued? Is it legal to use where I operate?",
        a: "Used the way it's meant to be — as a screen that informs your decision, with a human making every call — QDX is built to support compliant hiring: job-relevant questions, EEOC-safe framings, automatic 4/5ths adverse-impact flags, and EEO reporting. That said, hiring laws vary by state and city (some places have specific rules for automated employment decision tools), and we're not your lawyer — check the rules where you operate.",
      },
      {
        q: "Is candidate data secure, and who owns it?",
        a: "Your candidate data is yours. It's stored in a secure, access-controlled database, used only to power your hiring and your benchmarks, and never sold. You can delete candidate records at any time.",
      },
    ],
  },
  {
    title: "Accounts & users",
    items: [
      {
        q: "Why one Operator account instead of separate Solo accounts per location?",
        a: "Fair question — Operator runs $79/location vs. $59 for a Solo account, so you're paying a small premium per store. Here's what that premium buys: one login across every location, a single careers page and unified candidate pipeline, cross-store hiring analytics and benchmarking, SMS notifications, unlimited AI job descriptions, and advanced EEO reporting (EEO-1, OFCCP) — none of which separate Solo accounts can do, because each one is an island with its own login and no consolidated view. You also get double the included assessments (50/location vs. 25) at a lower overage rate, so for busy stores the effective cost gap is smaller than the sticker difference. And past 10 locations the rate drops to $69. Short version: separate Solo accounts are cheaper per store but leave you stitching everything together by hand; Operator is built to run a multi-unit hire from one place.",
      },
      {
        q: "Can my GMs each have their own login?",
        a: "Yes — each plan includes seats so your managers can log in themselves. Solo includes 2 users; Operator includes 2 plus 1 per location, so every store's manager gets a login while you keep the cross-store view; Enterprise is unlimited.",
      },
    ],
  },
  {
    title: "Plans & pricing",
    items: [
      {
        q: "What does it cost?",
        a: (
          <>
            Three plans, all with a 30-day free trial and two months free if you
            pay annually:
            <ul className="mt-3 space-y-3 list-none">
              <li>
                <strong>Solo — $59/mo per location</strong> (or $590/yr). One
                store, 2 users. Includes 25 assessments/month, then $3 each
                (capped at $25/mo). Everything you need to hire for a single
                location: branded hiring page + QR codes, the 5-minute assessment,
                verbal bands + fit recommendation, local crew benchmark, basic
                EEO/fairness flags, and your candidate pipeline.
              </li>
              <li>
                <strong>
                  Operator — $79/location/mo, dropping to $69 at 10+ locations.
                </strong>{" "}
                Two or more stores, 2 users + 1 per location. Includes 50
                assessments/location/month, then $2 each (capped $50/location).
                Everything in Solo plus one login across all locations, a unified
                careers page and pipeline, SMS, unlimited AI job descriptions,
                cross-store analytics and benchmarking, and advanced EEO reporting
                (EEO-1, OFCCP).
              </li>
              <li>
                <strong>Enterprise — let&apos;s talk</strong> (starts around
                $2,500/mo). For brands, groups, and multi-brand operators:
                unlimited assessments and seats, brand hierarchy and cross-brand
                rollup, Tier 2/3 norming, audit-ready compliance exports,
                SSO/SAML/SCIM + API, and a dedicated success manager.
              </li>
            </ul>
          </>
        ),
      },
      {
        q: "What happens if I go over my monthly assessments?",
        a: "Each plan includes a monthly assessment allowance — 25/location on Solo, 50/location on Operator. If you go over, extra assessments are billed per assessment ($3 each on Solo, $2 on Operator), and that overage is capped ($25/mo on Solo, $50/location on Operator) so a big hiring month can't run away from you. Enterprise includes unlimited assessments.",
      },
      {
        q: "Monthly or annual — and am I locked into a contract?",
        a: "Both Solo and Operator are month-to-month, with a 30-day free trial to start. Pay annually and you get two months free. There's no long-term contract on Solo or Operator — cancel anytime; Enterprise terms are set as part of your agreement.",
      },
      {
        q: "When should I move from Solo to Operator?",
        a: "As soon as you're running a second location. Solo is built for a single store; the moment you're hiring across two or more, Operator's one login, unified pipeline, and cross-store reporting save you from managing separate accounts. It's also worth upgrading if you're hitting your assessment cap often or want SMS, AI job descriptions, or advanced EEO reporting.",
      },
    ],
  },
  {
    title: "Setup & integrations",
    items: [
      {
        q: "How long does it take to set up?",
        a: "Fast — there's nothing to build. Your branded hiring page and QR codes are ready to go, you configure your application form and roles, and you can be taking applications the same day.",
      },
      {
        q: "Can I control the application form and roles?",
        a: "Yes. You set up the roles you're hiring for and tailor the application form to ask what you actually need from candidates. As your hiring needs change, you adjust both yourself without starting over.",
      },
      {
        q: "What about back-of-house vs. front-of-house?",
        a: "It's one assessment, measuring the core traits that matter across a restaurant — reliability, people skills, ownership, composure, plus motivation. You decide which signals to weigh most for a given role: people skills tend to carry more for a front-counter or drive-thru hire, while reliability and composure under pressure matter everywhere. You set up the role and read the bands with that lens.",
      },
      {
        q: "Does it integrate with my POS, scheduling, payroll, or ATS?",
        a: "QDX runs as your front-door hiring and screening system — post, apply, assess, decide. Connecting to other systems — POS, scheduling, payroll, ATS — over an API is on the Enterprise roadmap.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <ApexHeader />
      <main className="flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-center">
            Questions operators ask.
          </h1>
          <p className="text-center text-[color:var(--brand-ink-muted)] mt-3 max-w-xl mx-auto">
            Everything about how QDX works, what it costs, and how it keeps
            hiring fair. Don&apos;t see your question?{" "}
            <Link href="/demo" className="underline text-[color:var(--brand-pink-600)]">
              Talk to us
            </Link>
            .
          </p>

          <div className="mt-10 space-y-10">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-extrabold tracking-tight text-[color:var(--brand-pink-600)]">
                  {section.title}
                </h2>
                <div className="mt-3 divide-y divide-[color:var(--brand-line)] bg-white rounded-2xl border border-[color:var(--brand-line)]">
                  {section.items.map((it, i) => (
                    <details
                      key={i}
                      className="group p-5 [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex cursor-pointer items-center justify-between gap-3 font-bold">
                        {it.q}
                        <span className="text-[color:var(--brand-pink)] transition group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <div className="mt-3 text-[color:var(--brand-ink-muted)] leading-relaxed">
                        {it.a}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/signup" className="btn-primary">
              Start free
            </Link>
            <p className="mt-3 text-xs text-[color:var(--brand-ink-muted)]">
              30-day free trial. Cancel anytime.
            </p>
          </div>
        </div>
      </main>
      <ApexFooter />
    </>
  );
}
