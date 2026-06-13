import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "QDX One — Restaurant hiring FAQs",
  description:
    "Plain answers to the questions restaurant owners ask about QDX One: how it works, how it compares, what applying is like, fairness, accounts, pricing, and setup.",
};

type Item = { q: string; a: React.ReactNode };
type Section = { title: string; items: Item[] };

const SAMPLE = (
  <Link href="/assessments" className="underline text-[color:var(--brand-pink-600)]">
    See sample questions →
  </Link>
);

const SECTIONS: Section[] = [
  {
    title: "The basics",
    items: [
      {
        q: "What is QDX One?",
        a: "QDX One helps restaurants hire. You post your open jobs, people apply on your own hiring page, and each person who applies takes a short 5-minute assessment on their phone. You get back a ranked list that shows who is likely to be a strong hire, so you spend your time on the best people. You always make the final call — QDX rates people, it never turns anyone down for you.",
      },
      {
        q: "Why use QDX instead of just interviewing people myself?",
        a: "You already know how to read people — QDX helps you read the right ones. A quick interview is a hit-or-miss way to tell who will show up on time and take ownership, and you can't interview everyone when you're slammed. QDX gives you a steady read on everyone who applies before you spend a minute interviewing, so you walk in already knowing who is worth your time. It doesn't decide for you — it points you at the right people.",
      },
      {
        q: "I'm short-staffed — won't this slow me down?",
        a: "It's built for being slammed. The assessment goes out the moment someone applies, they finish it on their phone, and you get a ranked list instead of a stack of resumes to dig through. You only interview the people who already clear your bar — so you hire faster, not slower.",
      },
      {
        q: "Does it replace the interview?",
        a: "No — it's a quick check before the interview. It gives you simple Low / Medium / High ratings on things like being reliable, good with people, taking ownership, and staying calm under pressure. You still meet the person and still make the call. QDX rates people; it never turns them down.",
      },
    ],
  },
  {
    title: "How it compares",
    items: [
      {
        q: "How is this different from a job board like Indeed?",
        a: "They do different jobs. Indeed and other job boards get people to apply. QDX is what happens next: it takes those applicants, sizes them up, and ranks them so you know who to focus on. Keep posting wherever you like — QDX takes over once people apply.",
      },
      {
        q: "How is this different from a personality test?",
        a: (
          <>
            A personality test just hands you a profile and stops there. QDX is
            built for restaurant hiring: we measure the things that actually
            matter on a shift — being reliable, good with people, taking
            ownership, and staying calm — plus a quick read on what drives
            someone. It&apos;s built into your hiring, gives plain Low / Medium /
            High ratings instead of exact-looking scores, and quietly checks that
            your hiring stays fair. {SAMPLE}
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
        a: "About five minutes, on a phone, right after someone applies.",
      },
      {
        q: "What does the assessment actually look like?",
        a: (
          <>
            It&apos;s a short set of questions someone answers on their phone in
            about five minutes. Most are quick &ldquo;what would you do&rdquo;
            situations where they pick an answer on a simple scale. There are no
            trick questions and no obvious right answers, and it&apos;s written in
            plain, everyday words. You can see the exact questions yourself:{" "}
            {SAMPLE}
          </>
        ),
      },
      {
        q: "Is it available in Spanish? What if someone struggles with English?",
        a: "Right now it's in English, written in plain, everyday words so it's easy to read. Spanish is coming — if you need it for your stores, tell us and we'll move it up the list.",
      },
      {
        q: "Will asking people to take an assessment scare them off?",
        a: "It's built not to. It's about five minutes, it's on their phone, and it comes right after they apply — so it never gets in the way of someone applying in the first place. Because it's short and easy, most people finish it, and the ones who do are already showing a little follow-through. The goal is better people to talk to, without fewer people applying.",
      },
      {
        q: "Can people fake or game it?",
        a: "No assessment is perfectly fake-proof, but this one is hard to game. The questions don't have an obvious right answer, and the system looks at patterns across all the answers instead of trusting any single one. You see results as ratings plus an overall fit, not a pass/fail — so even someone trying to game one part still gives you a full picture, and you always make the final call in person.",
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
        q: "Do I get one overall score, or a recommendation?",
        a: "You get simple Low / Medium / High ratings on each thing we measure, plus an overall fit rating — not one exact number. We use ratings on purpose: these measures aren't exact to the decimal, and ratings keep you from reading too much into tiny differences. Treat the fit rating as a starting point, not the final word.",
      },
      {
        q: "Should I just hire everyone rated High?",
        a: "No — and we built it to steer you away from that. High ratings point you to strong people, but a rating is a quick read, not a score of someone's worth, and a great hire can land in the Medium range on something. Use the ratings to pick who to interview and what to ask, then make the call like you always have.",
      },
      {
        q: "What if my gut disagrees with the ratings?",
        a: "Trust your gut — it's your call. The assessment is one more piece of information, not an override. When the ratings and your read of someone don't match, that's a good thing to dig into during the interview, not a reason to ignore what you saw in person. QDX is there to help your judgment, never replace it.",
      },
    ],
  },
  {
    title: "Fairness & the law",
    items: [
      {
        q: "Is it fair? What about bias?",
        a: "Fairness is built in from the start. A person makes every decision — QDX never turns anyone down on its own. Results come as simple ratings so no one reads too much into small gaps, the questions are job-related and worded to follow fair-hiring rules, and the system automatically flags it if any group is being screened out at a lower rate than others. There's also an optional background question (things like race and gender) that you never see tied to any one person — only as overall totals. And if you ever compare applicants to your current team, there are guardrails so you're not just cloning the staff you already have. No tool is bias-proof, but this one is built to catch and track bias, not hide it.",
      },
      {
        q: "Is it legal? Could it get me sued?",
        a: "Used the way it's meant to be — as a helper, with a person making every call — QDX is built to support fair, legal hiring: job-related questions, fair-hiring wording, automatic fairness checks, and reports you can show. That said, hiring laws are different from state to state and city to city (some places have special rules for hiring tools that score people by computer), and we're not your lawyer — check the rules where you operate.",
      },
      {
        q: "Is applicant information safe, and who owns it?",
        a: "Your applicants' information is yours. We keep it in a secure, locked-down database, use it only to run your hiring, and never sell it. You can delete records any time.",
      },
    ],
  },
  {
    title: "Accounts & logins",
    items: [
      {
        q: "Why one Operator account instead of a separate account for each store?",
        a: "Fair question — Operator is $79 a store vs. $59 for a single Solo account, so you pay a little more per store. Here's what the extra buys: one login for every store, one hiring page and one ranked list across all of them, reports that compare your stores, text-message alerts, unlimited AI-written job posts, and fairness reports across your stores — none of which separate accounts can do, because each one stands alone with its own login and no shared view. You also get twice the included assessments (50 a store vs. 25) at a lower per-extra rate, so for busy stores the real gap is smaller than it looks. And past 10 stores the price drops to $69. Short version: separate accounts are a little cheaper per store but leave you piecing everything together by hand; Operator runs all your stores from one place.",
      },
      {
        q: "Can my managers each have their own login?",
        a: "Yes — each plan comes with logins for your managers. Solo includes 2, Operator includes 2 plus 1 for each store, and Enterprise is unlimited.",
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
            pay for the year:
            <ul className="mt-3 space-y-3 list-none">
              <li>
                <strong>Solo — $59 a month per store</strong> (or $590 a year).
                One store, 2 logins. Includes 25 assessments a month, then $3 each
                (never more than $25 extra a month). Everything you need to hire
                for one store: your own hiring page and QR codes, the 5-minute
                assessment, Low/Medium/High ratings plus an overall fit, a
                comparison against your own crew, basic fairness checks, and your
                ranked applicant list.
              </li>
              <li>
                <strong>
                  Operator — $79 a store per month, dropping to $69 at 10+ stores.
                </strong>{" "}
                Two or more stores, 2 logins plus 1 per store. Includes 50
                assessments per store a month, then $2 each (never more than $50
                per store). Everything in Solo plus one login for all stores, one
                shared hiring page and list, text-message alerts, unlimited
                AI-written job posts, reports that compare your stores, and
                fairness reports across them.
              </li>
              <li>
                <strong>Enterprise — let&apos;s talk</strong> (starts around
                $2,500 a month). For brands and large groups: unlimited
                assessments and logins, reporting across many brands, company-wide
                single sign-on, a developer connection (API), and a dedicated
                contact. Sales-led — talk to us.
              </li>
            </ul>
          </>
        ),
      },
      {
        q: "What happens if I go over my monthly assessments?",
        a: "Each plan comes with a set number each month — 25 a store on Solo, 50 a store on Operator. If you go over, each extra one costs a little ($3 on Solo, $2 on Operator), and there's a monthly cap ($25 on Solo, $50 a store on Operator) so a big hiring month can't run away from you. Enterprise has no limit.",
      },
      {
        q: "Monthly or yearly — and am I locked into a contract?",
        a: "Both Solo and Operator are month-to-month, with a 30-day free trial to start. Pay for the year and you get two months free. There's no long-term contract on Solo or Operator — cancel any time. Enterprise terms are set in your agreement.",
      },
      {
        q: "When should I move from Solo to Operator?",
        a: "As soon as you run a second store. Solo is built for one store; the moment you're hiring for two or more, Operator's one login, shared list, and store-by-store reports save you from juggling separate accounts. It's also worth it if you keep hitting your monthly cap or want text alerts, unlimited AI job posts, or fairness reports across stores.",
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
        a: "It's one assessment, measuring the things that matter all over a restaurant — being reliable, good with people, taking ownership, and staying calm. You decide what to weigh most for a given job: being good with people matters more at the front counter or drive-thru, while being reliable and calm under pressure matters everywhere. You set up the job and read the ratings with that in mind.",
      },
      {
        q: "Does it connect to my POS, scheduling, payroll, or other systems?",
        a: "QDX is your front door for hiring — post, apply, assess, decide. Connecting it to other systems (POS, scheduling, payroll, and the like) is coming on the Enterprise plan.",
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
            How QDX works, what it costs, and how it keeps hiring fair — in plain
            words. Don&apos;t see your question?{" "}
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
              30-day free trial. Cancel any time.
            </p>
          </div>
        </div>
      </main>
      <ApexFooter />
    </>
  );
}
