import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "QDXone — Enterprise & compliance",
  description:
    "How QDXone is designed to support consistent, well-documented hiring across locations and brands: human decisions on every candidate, plain-English bands, separated EEO data, and adverse-impact monitoring.",
};

type Item = { q: string; a: React.ReactNode };
type Section = { title: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    title: "How the product is built",
    items: [
      {
        q: "Is the assessment job-related?",
        a: "It measures qualities chosen for their relevance to restaurant roles — reliability, people skills, ownership, composure, and motivation — and the framework was reviewed by a credentialed I/O psychologist. It is designed with the EEOC's Uniform Guidelines' expectations for job-relatedness in mind. We'll walk your talent and legal teams through the methodology and validation approach during an enterprise review.",
      },
      {
        q: "Who makes hiring decisions?",
        a: "A person on your team, on every candidate. QDXone assesses every applicant the same way and reports plain Low/Mid/High bands and interview flags — it never rejects, advances, or scores anyone into a decision. This human-decision design is directly relevant to how laws like NYC Local Law 144 define regulated tools; whether a specific law applies to your deployment is a determination for your counsel, and where an independent bias audit or candidate notice is required, we'll work with you and a qualified auditor and provide the data they need.",
      },
      {
        q: "How is demographic (EEO) data handled?",
        a: "The demographic questionnaire is optional for candidates, stored separately from selection data, never shown to the people making hiring decisions, and used only in aggregate — where monitoring flags when a group's selection rate falls noticeably below others (the four-fifths rule of thumb the EEOC uses). How to act on a flag stays a call for your team; the platform never silently proceeds, and we'll help you interpret what you're seeing.",
      },
      {
        q: "How does it avoid baking in our existing team's profile?",
        a: "Comparisons against your current crew are aggregate-only and framed as context, not a hiring ideal — incumbents shouldn't define the bar.",
      },
    ],
  },
  {
    title: "Data & security",
    items: [
      {
        q: "How is candidate and EEO data stored and protected?",
        a: "Your data is yours — stored in a secure, access-controlled database, used only to run your hiring, and never sold. EEO data is kept separate from selection data and only ever used in aggregate. For a full security and privacy review (encryption, retention, sub-processors), reach out and we'll walk your team through it.",
      },
    ],
  },
  {
    title: "What's on the enterprise roadmap",
    items: [
      {
        q: "What's built today, and what's coming?",
        a: "Built today: everything above, plus per-location and cross-store reporting. On the roadmap, scoped with enterprise partners: filing-ready EEO-1/OFCCP exports, brand-hierarchy rollups, audit-ready compliance exports, candidate notice and disclosure templates, documented alternative-process pathways, and built-in accommodation options (alternative formats, extended time, screen-reader flows — today we handle accommodations with you directly, case by case). Tell us what your team needs to produce and we'll tell you candidly what's built versus what we're building.",
      },
    ],
  },
];

export default function EnterprisePage() {
  return (
    <>
      <ApexHeader />
      <main className="flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-center">
            Enterprise &amp; compliance.
          </h1>
          <p className="text-center text-[color:var(--brand-ink-muted)] mt-3 max-w-xl mx-auto">
            How QDXone is designed to support consistent, well-documented
            hiring across your locations and brands — and a candid line on
            what&apos;s built today versus what we&apos;re building.
          </p>

          <p className="mt-6 card text-sm text-[color:var(--brand-ink-muted)] bg-[color:var(--brand-cream)]">
            <strong>Not legal advice.</strong> These answers describe how
            QDXone is designed to <em>support</em>&nbsp;compliant hiring;
            QDXone doesn&apos;t determine compliance for your business. Hiring
            laws vary by state and city and change often — confirm specifics
            with your own counsel.
          </p>

          <div className="mt-8 space-y-10">
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
            <Link href="/demo" className="btn-primary">
              Talk to our team
            </Link>
            <p className="mt-3 text-xs text-[color:var(--brand-ink-muted)]">
              We&apos;ll walk your talent, legal, and security teams through
              the details.
            </p>
          </div>
        </div>
      </main>
      <ApexFooter />
    </>
  );
}
