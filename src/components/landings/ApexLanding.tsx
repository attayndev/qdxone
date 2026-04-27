import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

/**
 * Apex marketing site — qdx.one
 * Operator-focused: behavioral pre-screening for restaurants.
 */
export default function ApexLanding() {
  return (
    <>
      <ApexHeader active="/" />
      <main className="flex-1">
        <Hero />
        <PainStrip />
        <HowItWorks />
        <WhatWeMeasure />
        <LookInside />
        <AudienceSplit />
        <FounderBlock />
        <PricingPeek />
        <Faq />
        <FinalCta />
      </main>
      <ApexFooter />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="px-4 sm:px-6 pt-12 sm:pt-20 pb-10">
      <div className="max-w-4xl mx-auto text-center">
        <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)] mb-5">
          Behavioral pre-screening for restaurants
        </span>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.02]">
          You can&apos;t afford a bad hire.
          <br />
          <span className="text-[color:var(--brand-pink)]">
            You can&apos;t afford to find out the slow way, either.
          </span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-[color:var(--brand-ink-muted)] max-w-2xl mx-auto">
          A 5-minute behavioral assessment built for QSR, fast-casual, and
          independent restaurants. Send a link. Get a scored report. Skip
          the interviews that were going to be a waste anyway.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary">
            Start a 7-day trial
          </Link>
          <Link href="/assessments" className="btn-ghost">
            See sample questions
          </Link>
        </div>
        <p className="mt-4 text-sm text-[color:var(--brand-ink-muted)]">
          7-day trial on annual plans. No card needed.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
function PainStrip() {
  const items = [
    {
      icon: "⚡",
      body: "One bad hire wrecks a shift, the team, and a week of your time.",
    },
    {
      icon: "⏱",
      body: "The average 20-minute interview tells you almost nothing about whether they&apos;ll show up.",
    },
    {
      icon: "📉",
      body: "Most operators don&apos;t have HR. They have an inbox, a gut feeling, and not enough time.",
    },
  ];
  return (
    <section className="px-4 sm:px-6 py-8 bg-[color:var(--brand-ink)] text-white">
      <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-5 sm:gap-8">
        {items.map((it, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className="text-2xl flex-shrink-0">{it.icon}</span>
            <p
              className="text-[15px] leading-snug font-medium"
              dangerouslySetInnerHTML={{ __html: it.body }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section className="px-4 sm:px-6 py-16 border-b border-[color:var(--brand-line)]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center">
          Three steps. Twenty minutes start to finish.
        </h2>
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          <Step
            n="1"
            title="Invite the candidate"
            body="Add a name and an email or phone. We generate a unique, secure link."
          />
          <Step
            n="2"
            title="They take the assessment on their phone"
            body="5–7 minutes. Mobile-first. No login. No download. No friction."
          />
          <Step
            n="3"
            title="You read the report"
            body="Six trait scores, risk flags, recommendation tier. Decide whose interview is worth your hour."
          />
        </div>
        <div className="text-center mt-10">
          <Link
            href="/how-it-works"
            className="font-semibold text-[color:var(--brand-pink-600)] hover:underline"
          >
            See a full walkthrough →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="card">
      <div className="text-4xl font-black text-[color:var(--brand-pink)] leading-none">
        {n}
      </div>
      <h3 className="mt-3 font-extrabold text-lg leading-snug">{title}</h3>
      <p className="text-[color:var(--brand-ink-muted)] mt-2 text-[15px] leading-relaxed">
        {body}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function WhatWeMeasure() {
  const traits = [
    {
      name: "Reliability",
      body: "If they say they'll be there, they're there — five minutes early.",
    },
    {
      name: "Coachability",
      body: "Feedback sharpens them. It doesn't put them on defense.",
    },
    {
      name: "Ownership",
      body: "\"What was my part?\" before \"Whose fault was that?\"",
    },
    {
      name: "Rule-fit",
      body: "Comfortable with structure — even rules they don't love.",
    },
    {
      name: "Composure",
      body: "Stays calm when the line is out the door or a guest is upset.",
    },
    {
      name: "Customer instincts",
      body: "Apologizes, fixes it, stays in the conversation.",
    },
  ];
  return (
    <section className="px-4 sm:px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            What we score.
          </h2>
          <p className="mt-3 text-[color:var(--brand-ink-muted)] text-lg">
            Hiring frontline staff isn&apos;t about the perfect résumé. It&apos;s
            about whether they&apos;ll show up, follow the playbook, and treat
            your customers right.
          </p>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {traits.map((t) => (
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
  );
}

// ─────────────────────────────────────────────────────────────────────
function LookInside() {
  const samples = [
    {
      q: "When work is slow, what do you usually do?",
      measures: ["Initiative", "Productive without supervision"],
    },
    {
      q: "How do you usually respond when a manager corrects you?",
      measures: ["Coachability", "Defensiveness"],
    },
    {
      q: "What does being on time mean to you?",
      measures: ["Reliability", "Punctuality mindset"],
    },
    {
      q: "A customer is upset, and honestly it isn't really your fault. What do you do?",
      measures: ["Customer instincts", "Ownership"],
    },
  ];
  return (
    <section className="px-4 sm:px-6 py-16 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl">
          <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)] mb-3">
            A look inside the assessment
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Real questions. Real signal.{" "}
            <span className="text-[color:var(--brand-pink)]">
              Not personality astrology.
            </span>
          </h2>
          <p className="mt-3 text-[color:var(--brand-ink-muted)] text-lg">
            A few of the questions a candidate sees. Each maps to a behavior
            that decides whether they&apos;ll earn their shift.
          </p>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {samples.map((s, i) => (
            <div
              key={i}
              className="card border-l-4 border-l-[color:var(--brand-pink)]"
            >
              <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)] font-semibold">
                Sample question
              </div>
              <p className="mt-2 font-bold text-[17px] leading-snug">
                &ldquo;{s.q}&rdquo;
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

        <p className="mt-6 text-sm text-[color:var(--brand-ink-muted)]">
          Assessments can be tailored by role and operator preference — for
          example, opt in to a stricter phone-on-the-floor question if that&apos;s
          a non-negotiable in your shop.
        </p>
        <div className="mt-4">
          <Link
            href="/assessments"
            className="font-semibold text-[color:var(--brand-pink-600)] hover:underline"
          >
            See more sample questions and the trait map →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
function AudienceSplit() {
  return (
    <section className="px-4 sm:px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center">
          Built for your world.
        </h2>
        <div className="mt-10 grid md:grid-cols-2 gap-5">
          <AudienceCard
            chip="QSR & multi-unit"
            title="Built for the QSR pace."
            body="Frontline turnover is brutal. Manager hours are scarce. Brand consistency matters. QDX standardizes how you screen across stores so a strong candidate at one location looks like a strong candidate at all of them. Cut weak applicants from the funnel before they cost a shift leader 30 minutes."
            href="/for-qsr"
          />
          <AudienceCard
            chip="Mom & pop"
            title="Built for the operator who doesn't have HR."
            body="When you're running the floor and the office, one bad hire is one ruined Friday night. QDX gives you a quick, opinionated read on a candidate before you sit down with them — so you spend interview time on the people who could actually make it work."
            href="/for-independents"
          />
        </div>
      </div>
    </section>
  );
}

function AudienceCard({
  chip,
  title,
  body,
  href,
}: {
  chip: string;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <div className="card">
      <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)]">
        {chip}
      </span>
      <h3 className="mt-3 font-black text-2xl tracking-tight">{title}</h3>
      <p className="mt-3 text-[color:var(--brand-ink-muted)] leading-relaxed">
        {body}
      </p>
      <Link
        href={href}
        className="mt-4 inline-block font-semibold text-[color:var(--brand-pink-600)] hover:underline"
      >
        Learn more →
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function FounderBlock() {
  return (
    <section className="px-4 sm:px-6 py-16 bg-[color:var(--brand-ink)] text-white">
      <div className="max-w-3xl mx-auto">
        <span className="chip bg-white/10 text-white/80 mb-4">
          Built in a real shop
        </span>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
          I built QDX in my own shop. Here&apos;s why.
        </h2>
        <div className="mt-6 space-y-4 text-white/85 text-[17px] leading-relaxed">
          <p>
            I&apos;m Yan. I own a 16 Handles franchise. Like most restaurant
            owners, I&apos;ve spent more time and money on the <em>wrong</em>{" "}
            hires than I&apos;d like to admit.
          </p>
          <p>
            An hour interviewing someone who was never going to show up. A
            week training someone who was never going to follow a rule. A
            weekend covering a shift because someone &ldquo;wasn&apos;t feeling
            it&rdquo; by their second Friday.
          </p>
          <p>The math doesn&apos;t work. Not for me, not for any operator I know.</p>
          <p>
            So I built QDX — a 5-minute behavioral screen that tells me,
            before I waste my time, whether a candidate is worth interviewing.
            Today it&apos;s a product. It started as a tool I needed in my own
            store.
          </p>
        </div>
        <div className="mt-7">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 font-semibold text-[color:var(--brand-pink)] hover:underline"
          >
            Read the full story →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
function PricingPeek() {
  return (
    <section className="px-4 sm:px-6 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
          Operator pricing.{" "}
          <span className="text-[color:var(--brand-pink)]">No fluff.</span>
        </h2>
        <p className="mt-3 text-[color:var(--brand-ink-muted)] text-lg max-w-xl mx-auto">
          Two plans. Pay annual to save 30%. Add-on test types when you&apos;re
          ready to layer in cashier math or other skills.
        </p>
        <div className="mt-8 grid sm:grid-cols-2 gap-4 text-left">
          <PricePeek
            name="Starter"
            annualMonthly={25}
            monthly={35}
            quota={10}
          />
          <PricePeek
            name="Growth"
            annualMonthly={50}
            monthly={65}
            quota={25}
            highlight
          />
        </div>
        <div className="mt-7">
          <Link href="/pricing" className="btn-primary">
            See full pricing
          </Link>
        </div>
      </div>
    </section>
  );
}

function PricePeek({
  name,
  annualMonthly,
  monthly,
  quota,
  highlight,
}: {
  name: string;
  annualMonthly: number;
  monthly: number;
  quota: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "card " +
        (highlight ? "border-2 border-[color:var(--brand-pink)]" : "")
      }
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-black text-xl">{name}</h3>
        {highlight && (
          <span className="chip bg-[color:var(--brand-pink)] text-white">
            Most popular
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-black">${annualMonthly}</span>
        <span className="text-[color:var(--brand-ink-muted)] text-sm">
          /mo, annual
        </span>
      </div>
      <div className="text-xs text-[color:var(--brand-ink-muted)] mt-1">
        or ${monthly}/mo monthly · {quota} questionnaires/month
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function Faq() {
  const items: Array<{ q: string; a: React.ReactNode }> = [
    {
      q: "How long does the assessment take?",
      a: "5–7 minutes on a phone. Most candidates finish in under six.",
    },
    {
      q: "What does the assessment actually look like?",
      a: (
        <>
          Multiple-choice and short-answer questions, mixed with a couple of
          agreement-scale questions. Mobile-first, no login.{" "}
          <Link
            href="/assessments"
            className="underline text-[color:var(--brand-pink-600)]"
          >
            See sample questions →
          </Link>
        </>
      ),
    },
    {
      q: "Can I customize the questions for my concept?",
      a: "Yes. The default screen is built around frontline restaurant behaviors. Operators can opt in to specific rule questions (phone policy, cash handling, alcohol service) and add concept-specific scenarios.",
    },
    {
      q: "Will candidates feel screened out?",
      a: "No. The applicant flow is a clean, branded \"you're invited to apply\" experience. Scoring stays internal.",
    },
    {
      q: "How is this different from a personality test?",
      a: "Personality tests profile who someone is. QDX scores what they're likely to do on a shift — show up on time, take feedback, stay productive when it's slow, follow rules they don't love. We're predicting frontline behavior, not labeling traits.",
    },
    {
      q: "Do you integrate with my POS or scheduling software?",
      a: "Not yet. QDX runs as a standalone hiring layer — invite, screen, decide. Integrations land later.",
    },
  ];
  return (
    <section className="px-4 sm:px-6 py-16 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center">
          Questions operators ask.
        </h2>
        <div className="mt-8 divide-y divide-[color:var(--brand-line)] bg-white rounded-2xl border border-[color:var(--brand-line)]">
          {items.map((it, i) => (
            <details
              key={i}
              className="group p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 font-bold">
                {it.q}
                <span className="text-[color:var(--brand-pink)] group-open:rotate-45 transition-transform text-2xl leading-none">
                  +
                </span>
              </summary>
              <div className="mt-3 text-[color:var(--brand-ink-muted)] leading-relaxed">
                {it.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
function FinalCta() {
  return (
    <section className="px-4 sm:px-6 py-16 bg-[color:var(--brand-ink)] text-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Better hires. Faster.{" "}
          <span className="text-[color:var(--brand-pink)]">
            Built for the restaurant world.
          </span>
        </h2>
        <p className="mt-5 text-white/70 text-lg max-w-xl mx-auto">
          Stop interviewing people who were never going to make it past week
          two.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
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
  );
}
