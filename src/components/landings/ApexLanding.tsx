import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";
import { CommercialVideo } from "@/components/CommercialVideo";

/**
 * Apex marketing site — qdx.one
 * QDXone: The Shift-Ready Platform for restaurants — hire (apply + 5-minute
 * assessment + scored shortlist), schedule, and manage the team, all in one place.
 * It begins with Shift-Ready Hiring™. Positioning: docs/positioning-shift-ready-v2.md
 */
export default function ApexLanding() {
  return (
    <>
      <ApexHeader active="/" />
      <main className="flex-1">
        <Hero />
        <CommercialVideo
          heading="What a resume can't show you."
          sub="A 15-second film about the small moments that reveal who's shift-ready."
        />
        <PlatformPillars />
        <VolumeTrap />
        <HowItWorks />
        <WhatWeMeasure />
        <LookInside />
        <AudienceSplit />
        {/* [HIDDEN UNTIL ASSET EXISTS — PROOF STRIP] One permissioned
            operator pull quote + one real number goes here. Never ship with
            placeholder content. Spec: docs/site-strengthening/01-home.md +
            appendix-b #1/#2. */}
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
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.02]">
          The Shift-Ready Platform
          <br />
          <span className="text-[color:var(--brand-blue)]">
            for restaurants.
          </span>
        </h1>
        <p className="mt-5 text-2xl sm:text-3xl font-extrabold tracking-tight">
          Hire shift-ready. Then run the shift.
        </p>
        <p className="mt-4 text-lg sm:text-xl text-[color:var(--brand-ink-muted)] max-w-2xl mx-auto">
          It begins with hiring — every applicant takes a five-minute assessment,
          so you know who to call first instead of drowning in resumes. Then the
          same platform runs your schedule and your team, so the people you hire
          stay shift-ready.
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
function PlatformPillars() {
  const pillars = [
    {
      badge: "Start here",
      name: "Shift-Ready Hiring™",
      body: "Every applicant takes a five-minute assessment, so you get a scored shortlist — who to call first, not just a fuller inbox.",
      href: "/shift-ready-hiring",
    },
    {
      badge: "Then",
      name: "Scheduling",
      body: "Build the week and publish it to your team. Staff set availability, request time off, and pick up, drop, or swap shifts — with labor cost as you build.",
      href: "/how-it-works",
    },
    {
      badge: "And",
      name: "Team management",
      body: "Track your crew, run reviews on the same qualities you hired for, and finally see whether the assessment predicted how they'd do on the floor.",
      href: "/how-it-works",
    },
  ];
  return (
    <section className="px-4 sm:px-6 py-16 border-b border-[color:var(--brand-line)]">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            One platform, from application to schedule.
          </h2>
          <p className="mt-3 text-[color:var(--brand-ink-muted)] text-lg">
            It begins with Shift-Ready Hiring™ — and keeps working long after the
            hire. The same signal that told you who to call first follows the person
            onto the schedule and into their reviews.
          </p>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {pillars.map((p) => (
            <div key={p.name} className="card flex flex-col">
              <span className="chip bg-[color:var(--brand-soft)] text-[color:var(--brand-blue-600)] self-start">
                {p.badge}
              </span>
              <h3 className="mt-3 font-black text-xl tracking-tight">{p.name}</h3>
              <p className="mt-2 text-[color:var(--brand-ink-muted)] text-[15px] leading-relaxed flex-1">
                {p.body}
              </p>
              <Link
                href={p.href}
                className="mt-4 inline-block font-semibold text-[color:var(--brand-blue-600)] hover:underline"
              >
                Learn more →
              </Link>
            </div>
          ))}
        </div>
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
          You&apos;re still the one choosing whom to interview. QDXone is the
          step between the applications and the interview — every applicant
          assessed and scored, so the pile works for you.
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
            body="Each applicant comes back scored: plain Low / Mid / High bands on four job-relevant categories, plus flags worth asking about. The shortlist is your starting point — a person on your team makes every hiring decision, on every candidate."
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
        {/* [HIDDEN UNTIL ASSET EXISTS — SCREENSHOT PLACEHOLDER: MANAGER
            DASHBOARD] Annotated candidate-list screenshot goes here (bands,
            flags, one-tap text/schedule; no numeric scores, no "recommended"
            language in the image). Spec + caption copy:
            docs/site-strengthening/01-home.md + appendix-b #6. */}
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
            appear on a resume. QDXone assesses four that show up on every
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
          QDXone is a personality-based assessment built specifically for
          restaurant work — it measures job-relevant behaviors, not
          personality types. The framework is built on validated personality
          and motivation research and reviewed by a credentialed I/O
          psychologist. Results are plain-English bands — never a black-box
          number.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
function LookInside() {
  // Illustrative items written for this page — deliberately NOT drawn from
  // the live item bank, and never labeled with the construct they resemble
  // (publishing live items or item→construct maps would enable coaching).
  const samples = [
    "If I say I'll cover a shift, I'm there — even when something better comes up.",
    "When we're slammed, I'd rather hear I'm doing something wrong than keep doing it wrong.",
  ];
  return (
    <section className="px-4 sm:px-6 py-16 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl">
          <span className="chip bg-[color:var(--brand-soft)] text-[color:var(--brand-blue-600)] mb-3">
            A look inside the assessment
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Short statements.{" "}
            <span className="text-[color:var(--brand-blue)]">
              Straight answers.
            </span>
          </h2>
          <p className="mt-3 text-[color:var(--brand-ink-muted)] text-lg">
            Candidates rate short, plain-language statements about how they
            work — a 5-point scale, written at an everyday reading level. Two
            examples, written for this page (the live assessment draws on a
            larger, rotating set):
          </p>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {samples.map((q, i) => (
            <div
              key={i}
              className="card border-l-4 border-l-[color:var(--brand-blue)]"
            >
              <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)] font-semibold">
                Example item
              </div>
              <p className="mt-2 font-bold text-[17px] leading-snug">
                &ldquo;{q}&rdquo;
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-[color:var(--brand-ink-muted)]">
          Quiet quality checks — attention items and response-time flags —
          help keep results honest.
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
            body="Frontline turnover is brutal and manager hours are scarce. QDXone gives every location the same assessment and the same bands, so a strong candidate at one restaurant looks strong at all of them."
            href="/for-qsr"
          />
          <AudienceCard
            chip="Independent & owner-operated"
            title="Built for the operator who doesn't have HR."
            body="When you're running the floor and the office, one bad hire is one ruined Friday night. QDXone gives you a scored read on every applicant before you sit down with anyone."
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
          The whole platform on every plan — hiring, SMS, AI job posts, scheduling,
          and team management, with unlimited assessments and no surprise bills.
          One store on Solo; Operator brings every location under one login with
          cross-store reporting.
        </p>
        <div className="mt-8 grid sm:grid-cols-3 gap-4 text-left">
          <PricePeek name="Solo" price={79} priceSub="/mo · 1 location" quota="The full platform" />
          <PricePeek name="Operator" price={99} priceSub="/mo + $59 per added location" quota="Everything in Solo, across stores" highlight />
          <PricePeek name="Enterprise" price="Let's talk" quota="For brands & multi-location groups" />
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
  priceSub,
  quota,
  highlight,
}: {
  name: string;
  price: number | string;
  priceSub?: string;
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
        {priceSub && (
          <span className="text-[color:var(--brand-ink-muted)] text-sm">
            {priceSub}
          </span>
        )}
      </div>
      <div className="text-xs text-[color:var(--brand-ink-muted)] mt-1">
        {quota}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function Faq() {
  // Homepage carries only the four load-bearing questions; the rest —
  // fairness, results, pricing, setup — live in full on /faq and /pricing.
  const items: Array<{ q: string; a: React.ReactNode }> = [
    {
      q: "Why use QDXone instead of just interviewing people myself?",
      a: "You still interview — QDXone helps you choose where those minutes go. Resumes rarely show who'll show up, take feedback, and stay, and you can't interview a whole inbox. QDXone assesses every applicant on job-relevant qualities in about five minutes, turning a pile of 40 applications into a scored shortlist before your first phone call.",
    },
    {
      q: "I'm short-staffed — won't screening just slow me down?",
      a: "It speeds you up. The assessment is ~5 minutes on the candidate's phone right after they apply, and you see banded results instantly — no extra step for you. Hiring whoever walks in feels fast until the no-call-no-shows and two-week quits pile up.",
    },
    {
      q: "How is this different from a job board like Indeed?",
      a: "Job boards generate applicants — that part works. QDXone is the step after: every applicant lands in one place, assessed and scored into plain-English bands, so you have a clear starting point. Point your QDXone careers link or QR code anywhere you already recruit.",
    },
    {
      q: "Is this a personality test?",
      a: (
        <>
          It&apos;s a personality-based assessment, built for restaurant
          work. The difference from tests you&apos;ve seen: it measures
          job-relevant behaviors — showing up, taking feedback, staying
          steady when it&apos;s busy — not personality types; it&apos;s part
          of your application flow instead of a separate exercise; and
          results come back as plain bands, not a profile.{" "}
          <Link
            href="/assessments"
            className="underline text-[color:var(--brand-blue-600)]"
          >
            See sample items →
          </Link>
        </>
      ),
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
            More questions — fairness, results, setup →
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
            Hire shift-ready, then run the shift.
          </span>
        </h2>
        <p className="mt-5 text-white/70 text-lg max-w-xl mx-auto">
          The Shift-Ready Platform, built for the restaurant world.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary">
            Start free
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
