import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

/**
 * Apex marketing site — qdx.one
 * QDX One: applicant intake + screening platform for quick-service restaurants.
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
          Hiring built for restaurants
        </span>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.02]">
          Post the job.
          <br />
          <span className="text-[color:var(--brand-pink)]">
            Get back a scored shortlist.
          </span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-[color:var(--brand-ink-muted)] max-w-2xl mx-auto">
          QDX One is your hiring page, application, and a 5-minute assessment —
          all on the candidate&apos;s phone. Share a link or QR code, and crew
          come back ranked on reliability, people skills, and ownership.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary">
            Start free
          </Link>
          <Link href="/how-it-works" className="btn-ghost">
            See how it works
          </Link>
        </div>
        <p className="mt-4 text-sm text-[color:var(--brand-ink-muted)]">
          30-day free trial. Cancel anytime.
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
      body: "One no-call/no-show wrecks a shift, the team, and a week of your time.",
    },
    {
      icon: "⏱",
      body: "A 20-minute interview tells you almost nothing about whether they&apos;ll show up.",
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
          From posting to scored shortlist.
        </h2>
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          <Step
            n="1"
            title="Post the role"
            body="Pick a role and get a shareable link + QR code for your counter, window, or socials. Candidates apply from their phone."
          />
          <Step
            n="2"
            title="They apply & assess"
            body="A quick application, then a 5-minute assessment — mobile-first, plain language, no login or download. About 8 minutes total."
          />
          <Step
            n="3"
            title="You get a scored shortlist"
            body="Each candidate comes back with verbal bands, a fit recommendation, and quality flags. You decide whose interview is worth your hour."
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
  const cats = [
    {
      name: "Reliability & Drive",
      body: "Shows up on time, follows through, and pushes to get better — the #1 predictor of attendance and tenure.",
    },
    {
      name: "People Skills",
      body: "Genuine warmth with customers, cooperation with the team, and openness to coaching.",
    },
    {
      name: "Ownership",
      body: "Owns outcomes and mistakes, and does what needs doing without waiting to be told.",
    },
    {
      name: "Composure",
      body: "Stays calm and bounces back when the line is out the door or a guest is upset.",
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
            about whether they&apos;ll show up, work the team, and treat your
            customers right. We measure four things that predict exactly that.
          </p>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {cats.map((t) => (
            <div key={t.name} className="card">
              <h3 className="font-extrabold">{t.name}</h3>
              <p className="text-[color:var(--brand-ink-muted)] mt-1 text-[15px] leading-relaxed">
                {t.body}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-[color:var(--brand-ink-muted)]">
          Built on validated personality and motivation research, reviewed by a
          credentialed I/O psychologist. You get plain-English bands — never a
          black-box number.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
function LookInside() {
  const samples = [
    {
      q: "I show up on time, even when I don't feel like going.",
      measures: ["Dependability"],
    },
    {
      q: "When my manager points out a mistake, I focus on fixing it instead of defending myself.",
      measures: ["Coachability"],
    },
    {
      q: "When I see something that needs doing, I do it without waiting to be told.",
      measures: ["Initiative & Ownership"],
    },
    {
      q: "I stay calm when things get busy.",
      measures: ["Composure"],
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
            Real statements. Real signal.{" "}
            <span className="text-[color:var(--brand-pink)]">
              Not personality astrology.
            </span>
          </h2>
          <p className="mt-3 text-[color:var(--brand-ink-muted)] text-lg">
            Candidates rate short, honest statements on a 5-point scale. Each
            one maps to a behavior that decides whether they&apos;ll earn their
            shift.
          </p>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {samples.map((s, i) => (
            <div
              key={i}
              className="card border-l-4 border-l-[color:var(--brand-pink)]"
            >
              <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)] font-semibold">
                Sample item
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
          We also run quiet quality checks — attention items and response-time
          flags — so you can trust the result, not just the answers.
        </p>
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
            chip="Multi-unit & franchise"
            title="Consistent hiring across every location."
            body="Frontline turnover is brutal and manager hours are scarce — whether it's a fast-casual counter or a full-service floor. QDX standardizes how you screen across locations, so a strong candidate at one restaurant looks like a strong candidate at all of them, and your managers only interview the people worth their time."
            href="/for-qsr"
          />
          <AudienceCard
            chip="Independent & owner-operated"
            title="Built for the operator who doesn't have HR."
            body="When you're running the floor and the office, one bad hire is one ruined Friday night. QDX gives you a clear, scored read on every applicant before you sit down — so interview time goes to the people who could actually make it work."
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
            So I built QDX — a hiring page, application, and a 5-minute
            assessment that tells me, before I waste my time, who&apos;s worth
            interviewing. Today it&apos;s a product. It started as a tool I
            needed in my own store.
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
          Per-location pricing.{" "}
          <span className="text-[color:var(--brand-pink)]">No fluff.</span>
        </h2>
        <p className="mt-3 text-[color:var(--brand-ink-muted)] text-lg max-w-xl mx-auto">
          Start with everything you need to hire. You only pay for completed
          assessments — grow into a team, SMS, AI, and analytics as you scale.
        </p>
        <div className="mt-8 grid sm:grid-cols-3 gap-4 text-left">
          <PricePeek name="Starter" price={49} quota="25 / mo, then $3 ea" />
          <PricePeek name="Growth" price={99} quota="75 / mo, then $2 ea" highlight />
          <PricePeek name="Multi-unit" price="Let's talk" quota="Unlimited" />
        </div>
        <div className="mt-7">
          <Link href="/pricing" className="btn-primary">
            See full pricing
          </Link>
        </div>
        <p className="mt-3 text-sm text-[color:var(--brand-ink-muted)]">
          30-day free trial on both self-serve plans. Franchisees, groups &
          brands? Multi-unit is custom.
        </p>
      </div>
    </section>
  );
}

function PricePeek({
  name,
  price,
  quota,
  highlight,
}: {
  name: string;
  price: number | string;
  quota: string;
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
        <span className="text-3xl font-black">
          {typeof price === "number" ? `$${price}` : price}
        </span>
        {typeof price === "number" && (
          <span className="text-[color:var(--brand-ink-muted)] text-sm">
            /mo per location
          </span>
        )}
      </div>
      <div className="text-xs text-[color:var(--brand-ink-muted)] mt-1">
        {quota} completed assessments
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function Faq() {
  const items: Array<{ q: string; a: React.ReactNode }> = [
    {
      q: "How long does it take a candidate?",
      a: "About 8 minutes total — a short application plus a 5-minute assessment, all on their phone. No login, no app.",
    },
    {
      q: "What does the assessment look like?",
      a: (
        <>
          Short, plain-language statements candidates rate on a 5-point scale,
          written at a 6th-grade reading level and mobile-first. Built on
          validated personality and motivation constructs.{" "}
          <Link
            href="/assessments"
            className="underline text-[color:var(--brand-pink-600)]"
          >
            See sample items →
          </Link>
        </>
      ),
    },
    {
      q: "Do you auto-reject candidates?",
      a: "Never. QDX gives you verbal bands and a fit recommendation — decision support, not a filter. You make every hire/no-hire call.",
    },
    {
      q: "Can I control the application form and roles?",
      a: "Yes. You define your own roles, choose which application fields are required or hidden, and can review applications before sending the assessment if you want to filter out joke submissions.",
    },
    {
      q: "How is this different from a personality test?",
      a: "Personality tests profile who someone is. QDX predicts what they're likely to do on a shift — show up on time, take feedback, stay productive when it's slow. We're predicting frontline behavior, not labeling traits.",
    },
    {
      q: "Do you integrate with my POS or scheduling software?",
      a: "Not yet. QDX runs as a standalone hiring layer — post, apply, assess, decide. Integrations land later.",
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
            Start your 30-day trial
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
