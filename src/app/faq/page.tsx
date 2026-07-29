import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "QDXone — Restaurant hiring FAQs",
  description:
    "Plain answers to the questions restaurant owners ask about QDXone, The Shift-Ready Platform for hiring, scheduling, and team management: how it works, how it compares, applying, consistency, accounts, pricing, and setup.",
};

type Item = { q: string; a: React.ReactNode };
type Section = { title: string; items: Item[] };

const SAMPLE = (
  <Link href="/assessments" className="underline text-[color:var(--brand-blue-600)]">
    See sample questions →
  </Link>
);

const SECTIONS: Section[] = [
  {
    title: "The basics",
    items: [
      {
        q: "What is QDXone?",
        a: "QDXone is the Shift-Ready Platform for restaurants — it begins with hiring: you post your open jobs, people apply on your own hiring page, and every applicant takes a short five-minute assessment on their phone. You get back a scored shortlist — a clear starting point instead of a pile to dig through. QDXone evaluates job-relevant signals; it never makes the hiring decision for you.",
      },
      {
        q: "Why use QDXone instead of just interviewing people myself?",
        a: "You already know how to read people — QDXone helps you spend that skill on the right conversations. A quick interview is a hit-or-miss way to tell who will show up on time and take ownership, and you can't interview everyone when you're slammed. QDXone gives you a consistent read on everyone who applies before you spend a minute interviewing. It doesn't decide anything for you — it gives you a clearer starting point.",
      },
      {
        q: "I'm short-staffed — won't this slow me down?",
        a: "It's built for being slammed. The assessment goes out the moment someone applies, they finish it on their phone, and you get a scored shortlist instead of a stack of resumes to dig through. You can focus your interview time on the applicants who appear strongest — while the final decision stays entirely in your hands — so you hire faster, not slower.",
      },
      {
        q: "Does it replace the interview?",
        a: "No — it's a quick check before the interview. It gives you simple Low / Mid / High bands on things like being reliable, good with people, taking ownership, and staying calm under pressure. You still meet the person and still make the call.",
      },
    ],
  },
  {
    title: "How it compares",
    items: [
      {
        q: "How is this different from a job board like Indeed?",
        a: "They do different jobs. Indeed and other job boards get people to apply. QDXone is what happens next: every applicant is assessed and scored into plain-English bands, in one place, so you have a starting point. Keep posting wherever you like — QDXone takes over once people apply.",
      },
      {
        q: "Is this a personality test?",
        a: (
          <>
            It&apos;s a personality-based assessment, built for restaurant
            work. Three differences from the tests you&apos;ve seen: it
            measures job-relevant behaviors — showing up, taking feedback,
            staying calm — rather than typing people; it&apos;s part of
            applying, not a separate exercise; and results come back as plain
            bands rather than a profile or exact-looking scores. {SAMPLE}
          </>
        ),
      },
    ],
  },
  {
    title: "What applying is like",
    items: [
      {
        q: "How long does it take?",
        a: "The assessment is about five minutes, on a phone, right after someone applies. Application plus assessment together run about eight minutes total.",
      },
      {
        q: "What does the assessment actually look like?",
        a: (
          <>
            A short set of plain-language statements someone rates on a simple
            scale, on their phone. No trick questions, no login, no download.
            You can see the style yourself: {SAMPLE}
          </>
        ),
      },
      {
        q: "Is it available in Spanish? What if someone struggles with English?",
        a: "Right now it's in English, written in plain, everyday words so it's easy to read. Spanish is planned — if you need it for your stores, tell us and we'll move it up the list.",
      },
      {
        q: "Will asking people to take an assessment scare them off?",
        a: "It's built not to: about five minutes, on their phone, right after they apply — it never gets in the way of someone applying in the first place. And the people who do finish are already showing a little follow-through.",
        // [HIDDEN UNTIL ASSET EXISTS — PROOF] Replace "It's built not to"
        // with the real completion rate once collected (appendix-b #3).
      },
      {
        q: "Can people fake or game it?",
        a: "No assessment is perfectly fake-proof, but this one is hard to game. There are no obvious right-answer patterns across the set, quality checks — attention items and response-time flags — mark results that look rushed or inattentive, and results come back as bands plus interview flags, not a pass/fail. Whoever looks strong on paper still has to back it up face to face — with you.",
      },
      {
        q: "Do applicants see their own results?",
        a: "No — results go to you, not them. People take the assessment as part of applying and don't get a score or rating back.",
      },
    ],
  },
  {
    title: "Reading the results",
    items: [
      {
        q: "What do the results look like?",
        a: "Simple Low / Mid / High bands on each of four categories — Reliability & Drive, People Skills, Ownership, Composure — plus flags from a short motivation screener (things like past attendance and tenure expectation). Bands on purpose: these measures aren't exact to the decimal, and bands keep you from reading too much into tiny differences. Treat the shortlist as a starting point, not the final word.",
      },
      {
        q: "Should I just hire everyone banded High?",
        a: "No — and it's built to steer you away from that. High bands point to strong signals, but a band is a quick read, not a measure of someone's worth, and a great hire can land Mid on something. Use the bands to plan who to interview and what to ask, then make the call like you always have.",
      },
      {
        q: "What if my gut disagrees with the bands?",
        a: "Trust your gut — it's your call. The assessment is one more piece of information, not an override. When the bands and your read of someone don't match, that's a good thing to dig into during the interview, not a reason to ignore what you saw in person.",
      },
    ],
  },
  {
    title: "Fairness & the law",
    items: [
      {
        q: "How do you keep the process consistent and monitored?",
        a: "Here's what the product actually does. Every applicant gets the same assessment — nobody is skipped or screened out by the system, and a person on your team makes every hiring decision. Results come back as bands rather than exact-looking scores, so small differences don't get over-read. The demographic question is optional, and you never see it tied to any one person — only as overall totals, where monitoring flags if any group is being screened out at a noticeably lower rate than others. If you compare applicants to your current team, that comparison is aggregate-only. No tool can promise unbiased hiring — what we can promise is that these practices are built in and always on.",
      },
      {
        q: "Is it legal? Could it get me sued?",
        a: "QDXone is built so that a person makes every hiring call, questions are job-related, and the monitoring described above is always on — the practices that fair-hiring rules generally look for. But hiring laws differ by state and city (some places have special rules for hiring tools that score people by computer), and we're not your lawyer — check the rules where you operate.",
      },
      {
        q: "Is applicant information safe, and who owns it?",
        a: "Your applicants' information is yours. We keep it in a secure, locked-down database, use it only to run your hiring, and never sell it. You can delete records any time.",
      },
    ],
  },
  {
    title: "Accounts, plans & pricing",
    items: [
      {
        q: "What does it cost?",
        a: (
          <>
            Three plans, all with a 30-day free trial and two months free if you
            pay for the year:
            <ul className="mt-3 space-y-3 list-none">
              <li>
                <strong>Solo — $79 a month per store</strong> (or $790 a year).
                One store, 2 logins, <strong>unlimited assessments</strong>. The
                full platform for one store: your own hiring page and QR codes,
                the five-minute assessment, Low/Mid/High bands, your scored
                shortlist, SMS + candidate texting, AI-written job posts, staff
                scheduling, and team management.
              </li>
              <li>
                <strong>
                  Operator — $99 a month plus $59 for each additional
                  location
                </strong>{" "}
                (two months free paid yearly). Two or more stores, 2 logins
                plus 1 per store, <strong>unlimited assessments</strong>.
                Everything in Solo, now across every store: one login for all
                locations, a shared hiring page and shortlist, reports that
                compare your stores, and role-specific assessment modules.
              </li>
              <li>
                <strong>Enterprise — let&apos;s talk.</strong> For brands and
                large groups: unlimited assessments and logins, reporting
                across many brands, company-wide single sign-on, a developer
                connection (API), and a dedicated contact. Sales-led — talk to
                us.
              </li>
            </ul>
            <p className="mt-3">
              Assessments are unlimited on every plan — a busy hiring month
              never costs extra.
            </p>
          </>
        ),
      },
      {
        q: "When should I use Operator instead of separate Solo accounts?",
        a: "As soon as you run a second store. Operator is $99 for your first location and $59 for each additional one. The step up from Solo is the multi-location layer: one login for every store, one hiring page and shortlist across them, and reports that compare your stores. (SMS, AI-written job posts, scheduling, and team management are on every plan, including Solo.) The real difference is running everything from one place instead of juggling separate logins.",
      },
      {
        q: "Can my managers each have their own login?",
        a: "Yes — Solo includes 2 logins, Operator includes 2 plus 1 per store, and Enterprise is unlimited.",
      },
      {
        q: "Monthly or yearly — am I locked in?",
        a: "Both Solo and Operator are month-to-month, with a 30-day free trial to start. Pay for the year and you get two months free. No long-term contract on Solo or Operator — cancel any time. Enterprise terms are set in your agreement.",
      },
    ],
  },
  {
    title: "Setup & connecting other tools",
    items: [
      {
        q: "How long does it take to set up?",
        a: "Fast — there's nothing to build. Your hiring page and QR codes are ready to go, you set up your application form and the jobs you're hiring for, and you can be taking applications the same day.",
      },
      {
        q: "Can I control the application form and the jobs I post?",
        a: "Yes. You set up the jobs you're hiring for and change the application form to ask only what you actually need. As your hiring changes, you adjust both yourself — no starting over.",
      },
      {
        q: "What about back-of-house vs. front-of-house?",
        a: "It's one assessment, measuring qualities that matter all over a restaurant. Read the bands in the context of the job: people skills carry more weight at the counter or drive-thru; reliability and composure matter everywhere.",
      },
      {
        q: "Does it connect to my POS, scheduling, payroll, or other systems?",
        a: "QDXone is your front door for hiring — post, apply, assess, decide. Connections to other systems (POS, scheduling, payroll, and the like) are planned; tell us which system matters to you and we'll factor it into the order.",
      },
      {
        q: "Does QDXone do scheduling and manage my team?",
        a: "Yes. Once you've hired someone, the same platform builds your weekly schedule — staff set their own availability and time off, and can pick up, drop, or swap shifts — and lets you run performance reviews on the same qualities the assessment measures. That means you can see whether the assessment predicted how someone actually does on the floor. It's included on every plan, no separate signup.",
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
            Questions restaurant owners ask.
          </h1>
          <p className="text-center text-[color:var(--brand-ink-muted)] mt-3 max-w-xl mx-auto">
            How QDXone works, what it costs, and how we keep the process consistent — in plain
            words. Don&apos;t see your question?{" "}
            <Link href="/demo" className="underline text-[color:var(--brand-blue-600)]">
              Talk to us
            </Link>
            .
          </p>

          <div className="mt-10 space-y-10">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-extrabold tracking-tight text-[color:var(--brand-blue-600)]">
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
                        <span className="text-[color:var(--brand-blue)] transition group-open:rotate-45">
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
              30-day free trial. Cancel any time.
            </p>
          </div>
        </div>
      </main>
      <ApexFooter />
    </>
  );
}
