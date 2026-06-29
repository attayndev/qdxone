import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";
import { CommercialVideo } from "@/components/CommercialVideo";

export const metadata = {
  title: "About QDX — built by an operator, for operators",
  description:
    "QDX was built by Yan, the owner-operator of a 16 Handles franchise. The hiring platform for restaurants, made from real operating pain.",
};

export default function AboutPage() {
  return (
    <>
      <ApexHeader active="/about" />
      <main className="flex-1">
        <section className="px-4 sm:px-6 pt-12 pb-6">
          <div className="max-w-3xl mx-auto">
            <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)] mb-4">
              About QDX
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              Hi, I&apos;m Yan.
            </h1>
            <p className="mt-5 text-lg text-[color:var(--brand-ink-muted)]">
              I own a 16 Handles franchise in New City, New York. The
              day-to-day work is fun. The hiring is brutal.
            </p>
          </div>
        </section>

        <CommercialVideo />

        <section className="px-4 sm:px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-5 text-[17px] leading-relaxed">
            <p>
              My crew has always been a mix — some on their first job ever, some
              working part-time around classes or a second gig, some doing this
              full-time. I don&apos;t have an HR department or a recruiter — I
              have me, a phone, and a stack of applications.
            </p>
            <p>
              For years I&apos;d burn an hour interviewing somebody who, in
              retrospect, never had a shot. I&apos;d train them. They&apos;d
              no-call-no-show two weekends in. I&apos;d start over. And
              every time, the team that was already there picked up the
              slack — the same team I was supposed to be supporting, not
              leaning on.
            </p>
            <p>
              I&apos;d try harder on the next interview. Ask sharper
              questions. Watch for the &ldquo;tells.&rdquo; Some of it
              worked. A lot of it didn&apos;t. Hiring frontline staff is
              hard, and I am one operator with one set of instincts on a
              Tuesday afternoon between rushes.
            </p>
            <p className="text-2xl font-black tracking-tight text-[color:var(--brand-ink)]">
              I built QDX because I wanted a way to know — before I sat
              down with someone — whether they&apos;d show up on time, take
              direction, leave their phone in the office, and treat
              customers like a guest in their home.
            </p>
            <p>
              The first version was a Google Form for my own shop. The
              second version was a spreadsheet I scored myself. Now it&apos;s
              a real tool, with a real scoring engine, that does in five
              minutes what would take me a half-hour interview to even
              start measuring — and does it more consistently than I can,
              because I&apos;m human and I have favorites.
            </p>
            <p>
              Here&apos;s what QDX does for me, every week:
            </p>
            <ul className="space-y-2 text-[16px] pl-1">
              <li>
                ✓ Saves me hours I used to spend interviewing people who
                were never going to make it past their second weekend.
              </li>
              <li>
                ✓ Lets me ask sharper interview questions to the candidates
                who <em>do</em> get one — because I already know where the
                concerns are.
              </li>
              <li>
                ✓ Frees me up to focus on running the business and growing
                my franchise footprint, instead of restarting hiring for
                the same role for the third time this year.
              </li>
            </ul>
            <p>
              If you run a shop and you&apos;ve felt this exact pain — the
              wasted training hours, the phantom-shift no-shows, the kid
              you knew was wrong by Wednesday but you talked yourself into
              hiring anyway — this product was built for your world.
            </p>
            <p>
              Not for HR theory. Not for enterprise. For us.
            </p>
            <p className="text-[color:var(--brand-ink-muted)] italic">
              — Yan
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-cream)] border-y border-[color:var(--brand-line)]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              The principles that drive QDX.
            </h2>
            <ul className="mt-6 space-y-4 text-[16px] leading-relaxed">
              <Principle
                t="Operator-first, always."
                b="Every feature has to earn its way into a busy operator's day. If it adds clicks without saving time, it doesn't ship."
              />
              <Principle
                t="Behavior beats biography."
                b="The right hire is rarely the one with the best résumé. We screen for what people will actually do on a shift."
              />
              <Principle
                t="Honest signal, not a black box."
                b="Operators see plain-English bands and flags, and why a candidate landed where they did. Recommendations support your call — they never auto-reject anyone. No vibes-based AI shrouded in mystery."
              />
              <Principle
                t="Built in a real shop, tested in real shops."
                b="If a feature doesn't work for me at 16 Handles New City, it won't ship for you either."
              />
            </ul>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 bg-[color:var(--brand-ink)] text-white">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              If this sounds familiar, try it.
            </h2>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup" className="btn-primary">
                Start free
              </Link>
              <Link
                href="/demo"
                className="btn-ghost !text-white !border-white hover:!bg-white hover:!text-[color:var(--brand-ink)]"
              >
                Talk to me directly
              </Link>
            </div>
          </div>
        </section>
      </main>
      <ApexFooter />
    </>
  );
}

function Principle({ t, b }: { t: string; b: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 inline-block w-2 h-2 rounded-full bg-[color:var(--brand-pink)] flex-shrink-0" />
      <div>
        <strong>{t}</strong>{" "}
        <span className="text-[color:var(--brand-ink-muted)]">{b}</span>
      </div>
    </li>
  );
}
