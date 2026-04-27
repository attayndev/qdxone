import Link from "next/link";
import { BrandHeader, BrandFooter } from "@/components/Brand";
import InviteCodeForm from "@/components/InviteCodeForm";
import type { OrganizationRow } from "@/lib/supabase/types";

/**
 * The branded org landing — shown at the org's subdomain root.
 * Pulls all wording from `org.branding`.
 */
export default function OrgLanding({ org }: { org: OrganizationRow }) {
  const b = org.branding;
  const eyebrow = b.hero_copy_eyebrow ?? `Now hiring · ${b.location_subtitle ?? org.name}`;
  const h1Pre = b.hero_copy_h1_pre ?? "Join the team.";
  const h1Post = b.hero_copy_h1_post ?? "Earn it.";
  const phoneEnabled = b.phone_policy_enabled !== false;
  const phoneText =
    b.phone_policy_text ??
    "Phones live in the office during shifts. Phone use on the floor is a firing offense — no exceptions.";

  return (
    <>
      <BrandHeader org={org} />
      <main className="flex-1">
        <section className="px-4 sm:px-6 pt-10 sm:pt-16 pb-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)] mb-4">
              {eyebrow}
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">
              {h1Pre}{" "}
              <span className="text-[color:var(--brand-pink)]">{h1Post}</span>
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-[color:var(--brand-ink-muted)] max-w-xl mx-auto">
              We&apos;re picky about who joins the crew. Strong attitude beats
              fancy resume.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="#start" className="btn-primary">
                Enter your invitation
              </Link>
              <Link href="#what-were-looking-for" className="btn-ghost">
                What we look for
              </Link>
            </div>
            <p className="mt-5 text-sm text-[color:var(--brand-ink-muted)]">
              Applications are by invitation only.
            </p>
          </div>
        </section>

        <section
          id="what-were-looking-for"
          className="px-4 sm:px-6 py-12 bg-white border-y border-[color:var(--brand-line)]"
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center">
              What we look for
            </h2>
            <p className="text-center text-[color:var(--brand-ink-muted)] mt-2 max-w-xl mx-auto">
              You don&apos;t need fancy work history. You need a strong
              attitude and the willingness to own your shift.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {WE_LOOK_FOR.map((item) => (
                <div key={item.title} className="card">
                  <div className="text-2xl">{item.emoji}</div>
                  <h3 className="mt-2 font-bold text-lg">{item.title}</h3>
                  <p className="text-[color:var(--brand-ink-muted)] mt-1 text-sm leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              The role, straight up
            </h2>
            <ul className="mt-5 space-y-3 text-[color:var(--brand-ink)]">
              <li className="flex gap-3">
                <span className="mt-2 inline-block w-2 h-2 rounded-full bg-[color:var(--brand-pink)] flex-shrink-0" />
                Customer-facing. You&apos;ll be the face of the shop.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 inline-block w-2 h-2 rounded-full bg-[color:var(--brand-pink)] flex-shrink-0" />
                Cleaning, restocking, and prep — the unglamorous stuff that
                keeps a great shop great.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 inline-block w-2 h-2 rounded-full bg-[color:var(--brand-pink)] flex-shrink-0" />
                Teamwork, professionalism, and following the playbook.
              </li>
              {phoneEnabled && (
                <li className="flex gap-3">
                  <span className="mt-2 inline-block w-2 h-2 rounded-full bg-[color:var(--brand-pink)] flex-shrink-0" />
                  {phoneText}
                </li>
              )}
            </ul>
          </div>
        </section>

        <section
          id="start"
          className="px-4 sm:px-6 py-12 bg-[color:var(--brand-ink)] text-white"
        >
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Got an invitation?
            </h2>
            <p className="mt-2 text-white/70">
              Paste your code or open the link from your email or text.
            </p>
            <div className="mt-6">
              <InviteCodeForm />
            </div>
            <p className="mt-6 text-sm text-white/60">
              No invitation yet? Stop by {org.name} or contact the manager
              directly. We don&apos;t accept open applications online.
            </p>
          </div>
        </section>
      </main>
      <BrandFooter org={org} />
    </>
  );
}

const WE_LOOK_FOR = [
  {
    emoji: "💪",
    title: "Ownership",
    body: "When something goes wrong, you ask 'what was my part?' before 'whose fault is this?'",
  },
  {
    emoji: "👂",
    title: "Coachability",
    body: "Feedback doesn't sting your ego — it sharpens you.",
  },
  {
    emoji: "⏰",
    title: "Reliability",
    body: "If you say you'll be there, you're there — five minutes early.",
  },
  {
    emoji: "📋",
    title: "Respect for the rules",
    body: "Even the ones you don't love.",
  },
  {
    emoji: "🧹",
    title: "Useful when it's slow",
    body: "Empty store? You're already wiping, restocking, prepping.",
  },
  {
    emoji: "😊",
    title: "Customer-first attitude",
    body: "When a guest is upset, you stay calm and make it right.",
  },
];
