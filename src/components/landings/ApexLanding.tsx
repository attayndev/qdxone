import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";
import { CommercialVideo } from "@/components/CommercialVideo";

/**
 * Apex marketing site — qdx.one
 * QDXone: Shift-Ready Hiring for restaurants — mobile application, 5-minute
 * assessment, scored shortlist. Positioning: docs/positioning-shift-ready-hiring.md
 */
export default function ApexLanding() {
  return (
    <>
      <ApexHeader active="/" />
      <main className="flex-1">
        <Hero />
        <CommercialVideo
          heading="See QDXone in 15 seconds"
          sub="The application and the five-minute assessment, on the candidate's phone — and the scored shortlist you get back."
        />
        <VolumeTrap />
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
        <span className="chip bg-[color:var(--brand-soft)] text-[color:var(--brand-blue-600)] mb-5">
          Shift-Ready Hiring™ for restaurants
        </span>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.02]">
          Know who to
          <br />
          <span className="text-[color:var(--brand-blue)]">call first.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-[color:var(--brand-ink-muted)] max-w-2xl mx-auto">
          Every applicant completes a mobile application and a five-minute
          assessment. QDXone evaluates the qualities that matter in restaurant
          work — reliability, people skills, ownership — and hands you a scored
          shortlist.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary">
            Start building your shortlist
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
function VolumeTrap() {
  const items = [
    {
      icon: "📥",
      body: "Job boards can fill your inbox with applicants. That part works.",
    },
    {
      icon: "⏱",
      body: "But more applicants means more sorting, more screening calls, more interviews — not better hires.",
    },
    {
      icon: "📄",
      body: "And the resumes can't tell you the thing you actually need to know: who will show up, work well with people, and take ownership.",
    },
  ];
  return (
    <section className="px-4 sm:px-6 py-10 bg-[color:var(--brand-ink)] text-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center">
          The Applicant Volume Trap.
        </h2>
        <div className="mt-6 grid sm:grid-cols-3 gap-5 sm:gap-8">
          {items.map((it, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-2xl flex-shrink-0">{it.icon}</span>
              <p className="text-[15px] leading-snug font-medium">{it.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-7 text-center text-white/85 text-lg font-semibold max-w-2xl mx-auto">
          You&apos;re still the one deciding who deserves an interview. QDXone
          is the step between the applications and the interview — every
          applicant assessed, scored, and ranked, so the pile works for you.
        </p>
        <p className="mt-4 text-center">
          <Link
            href="/shift-ready-hiring"
            className="font-semibold text-[color:var(--brand-blue)] hover:underline"
          >
            What is Shift-Ready Hiring? →
          </Link>
        </p>
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
          How Shift-Ready Hiring works.
        </h2>
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          <Step
            n="1"
            title="Post the role"
            body="Pick a role and get a shareable link + QR code for your counter, window, or socials. Candidates apply from their phone."
          />
          <Step
            n="2"
            title="Every applicant assesses"
            body="A quick mobile application, then a five-minute assessment — plain language, no login or download. About 8 minutes total."
          />
          <Step
            n="3"
            title="You know who to call first"
            body="Each applicant comes back scored — plain-English bands, a fit recommendation, and flags worth asking about. The shortlist is your starting point for interviews."
          />
        </div>
        <div className="text-center mt-10">
          <Link
            href="/how-it-works"
            className="font-semibold text-[color:var(--brand-blue-600)] hover:underline"
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
      <div className="text-4xl font-black text-[color:var(--brand-blue)] leading-none">
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
      body: "Shows up on time, follows through, and pushes to get better — the first thing operators need and the hardest to read off a resume.",
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
            What shift-ready looks like.
          </h2>
          <p className="mt-3 text-[color:var(--brand-ink-muted)] text-lg">
            The qualities that make someone a great hourly employee rarely
            appear on a resume. QDXone evaluates four that show up on every
            shift.
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
          <span className="chip bg-[color:var(--brand-soft)] text-[color:var(--brand-blue-600)] mb-3">
            A look inside the assessment
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Real statements. Real signal.{" "}
            <span className="text-[color:var(--brand-blue)]">
              Not personality astrology.
            </span>
          </h2>
          <p className="mt-3 text-[color:var(--brand-ink-muted)] text-lg">
            Candidates rate short, honest statements on a 5-point scale. Each
            one maps to a behavior that makes someone shift-ready.
          </p>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {samples.map((s, i) => (
            <div
              key={i}
              className="card border-l-4 border-l-[color:var(--brand-blue)]"
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
            title="The same shortlist logic at every location."
            body="Frontline turnover is brutal and manager hours are scarce — whether it's a fast-casual counter or a full-service floor. QDXone gives every location the same scoring, so a strong candidate at one restaurant looks strong at all of them, and your managers start with who to call first instead of a raw inbox."
            href="/for-qsr"
          />
          <AudienceCard
            chip="Independent & owner-operated"
            title="Built for the operator who doesn't have HR."
            body="When you're running the floor and the office, one bad hire is one ruined Friday night. QDXone gives you a scored read on every applicant before you sit down — so interview time goes to the people most ready to join the shift."
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
      <span className="chip bg-[color:var(--brand-soft)] text-[color:var(--brand-blue-600)]">
        {chip}
      </span>
      <h3 className="mt-3 font-black text-2xl tracking-tight">{title}</h3>
      <p className="mt-3 text-[color:var(--brand-ink-muted)] leading-relaxed">
        {body}
      </p>
      <Link
        href={href}
        className="mt-4 inline-block font-semibold text-[color:var(--brand-blue-600)] hover:underline"
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
          I built QDXone in my own shop. Here&apos;s why.
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
            So I built QDXone — a hiring page, application, and a five-minute
            assessment that tells me, before I spend an hour, who to call
            first. Today it&apos;s a product. It started as a tool I needed in
            my own store.
          </p>
        </div>
        <div className="mt-7">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 font-semibold text-[color:var(--brand-blue)] hover:underline"
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
          <span className="text-[color:var(--brand-blue)]">No fluff.</span>
        </h2>
        <p className="mt-3 text-[color:var(--brand-ink-muted)] text-lg max-w-xl mx-auto">
          Unlimited assessments on every plan — no caps, no surprise bills. One
          store on Solo; Operator brings them all under one login with SMS, AI,
          and cross-store reporting.
        </p>
        <div className="mt-8 grid sm:grid-cols-3 gap-4 text-left">
          <PricePeek name="Solo" price={59} quota="1 location · unlimited" />
          <PricePeek name="Operator" price={79} quota="2+ loc · unlimited" highlight />
          <PricePeek name="Enterprise" price="Let's talk" quota="Brands & groups" />
        </div>
        <div className="mt-7">
          <Link href="/pricing" className="btn-primary">
            See full pricing
          </Link>
        </div>
        <p className="mt-3 text-sm text-[color:var(--brand-ink-muted)]">
          30-day free trial on both self-serve plans. Brands & multi-brand
          groups? Enterprise is custom.
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
        (highlight ? "border-2 border-[color:var(--brand-blue)]" : "")
      }
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-black text-xl">{name}</h3>
        {highlight && (
          <span className="chip bg-[color:var(--brand-blue)] text-white">
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
        {quota} assessments
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function Faq() {
  const items: Array<{ q: string; a: React.ReactNode }> = [
    {
      q: "Why use QDXone instead of just interviewing people myself?",
      a: "You still interview — QDXone decides where those minutes go. Resumes rarely show who'll show up, take feedback, and stay, and you can't interview a whole inbox. QDXone assesses every applicant on job-relevant qualities in about five minutes, turning a pile of 40 applications into a scored shortlist before your first phone call.",
    },
    {
      q: "I'm short-staffed — won't screening just slow me down?",
      a: "It speeds you up. The assessment is ~5 minutes on the candidate's phone right after they apply, and you see scored results instantly — no extra step for you. Hiring whoever walks in feels fast until the no-call-no-shows and two-week quits pile up; a bad hire costs far more in re-hiring and training than five minutes of screening.",
    },
    {
      q: "Does this replace the interview?",
      a: "No — it gives the interview a starting point. QDXone shows you who may deserve attention first and what to dig into; you still meet them and make the call. QDXone evaluates job-relevant signals; it never makes the hiring decision for you.",
    },
    {
      q: "How is this different from a job board like Indeed?",
      a: "Job boards generate applicants — that part works. QDXone is the step after: it assesses those applicants and ranks them, so you know who to call first. Point your QDXone careers link or QR code anywhere you already recruit — a job board, a window sign, Instagram — and every applicant lands in one scored shortlist.",
    },
    {
      q: "How is this different from a personality test?",
      a: (
        <>
          Personality tests profile who someone is. QDXone evaluates the
          qualities that show up on a shift — showing up on time, taking
          feedback, staying steady when it&apos;s busy. Job-relevant behavior,
          not trait labels.{" "}
          <Link
            href="/assessments"
            className="underline text-[color:var(--brand-blue-600)]"
          >
            See sample items →
          </Link>
        </>
      ),
    },
    {
      q: "How long does it take a candidate?",
      a: "About 8 minutes total — a short application plus a 5-minute assessment, all on their phone. No login, no app.",
    },
    {
      q: "Is it fair — could it screen people out unfairly?",
      a: "Fairness is built in. A person makes every call — QDXone never turns anyone down on its own. You see simple ratings, not exact scores, so no one reads too much into small gaps. The background question (race, gender, and so on) is optional, and you never see it tied to a person — only as totals — while the system flags it if any group is being screened out at a lower rate. It's written in plain words and works on any phone, so it doesn't quietly favor one group.",
    },
    {
      q: "Why one Operator account instead of a separate account per location?",
      a: "You could run a separate Solo account per store at $59 each — and some do at first. But Operator ($79/location) puts every location under one login, one careers page, and one candidate pipeline, plus the tools separate accounts don't get: SMS + candidate texting, AI-written job posts, and reports that compare your stores. The $20/location buys the power tools and one place to run it all — instead of juggling separate logins.",
    },
    {
      q: "What does it cost?",
      a: "Solo is $59 per location/month (one location). Operator (2+ locations) is $79 per location. Assessments are unlimited on both — no caps, no per-assessment fees. The $20/location step up to Operator buys unified login across stores, SMS + candidate texting, AI-written job posts, and cross-store reporting. 30-day free trial, card captured at signup.",
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
                <span className="text-[color:var(--brand-blue)] group-open:rotate-45 transition-transform text-2xl leading-none">
                  +
                </span>
              </summary>
              <div className="mt-3 text-[color:var(--brand-ink-muted)] leading-relaxed">
                {it.a}
              </div>
            </details>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/faq"
            className="font-semibold underline text-[color:var(--brand-blue-600)]"
          >
            See all questions →
          </Link>
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
          Stop collecting applicants.{" "}
          <span className="text-[color:var(--brand-blue)]">
            Start identifying the people most ready to join the shift.
          </span>
        </h2>
        <p className="mt-5 text-white/70 text-lg max-w-xl mx-auto">
          Shift-Ready Hiring, built for the restaurant world.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary">
            Try Shift-Ready Hiring
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
