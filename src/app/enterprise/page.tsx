import Link from "next/link";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export const metadata = {
  title: "QDX One — Enterprise & compliance",
  description:
    "How QDX One is designed to support fair, defensible hiring across locations and brands: human-in-the-loop decisions, separated EEO data, adverse-impact monitoring, and enterprise reporting.",
};

type Item = { q: string; a: React.ReactNode };
type Section = { title: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    title: "Validity & job-relatedness",
    items: [
      {
        q: "Is the assessment job-related?",
        a: "It measures traits chosen for their relevance to restaurant roles — reliability, people skills, ownership, composure, and motivation — and is designed to align with the EEOC's Uniform Guidelines on Employee Selection Procedures, which expect a selection tool to be job-related and consistent with business necessity. We're glad to walk your team through the methodology and our validation approach during an enterprise review.",
      },
      {
        q: "Can you share methodology and validation documentation?",
        a: "Yes — as part of an enterprise engagement we'll share our methodology and fairness documentation with your talent and legal teams. Reach out and we'll set up a review.",
      },
    ],
  },
  {
    title: "Adverse-impact & fairness monitoring",
    items: [
      {
        q: "How do you monitor for adverse impact?",
        a: "Hiring managers see plain Low/Medium/High ratings, but the platform keeps the underlying numbers to run fairness analysis. Combined with the voluntary background (EEO) questionnaire, that lets it flag when a group's selection rate falls below the four-fifths (80%) threshold the EEOC uses as a rule of thumb. The exact cadence and which groups are analyzed are something we'll scope with you during onboarding.",
      },
      {
        q: "What happens if a fairness flag fires?",
        a: "It surfaces for your team to investigate — the platform never silently proceeds, and it never rejects anyone on its own. Because a person makes every hiring decision, you retain full control over how to respond, and we're available to help you interpret what you're seeing. How to act on a flag is a legal/HR call that stays with you.",
      },
      {
        q: "How does it avoid baking in your existing bias?",
        a: "When you compare candidates to your current crew, that benchmark is aggregate-only and framed as a way to inform your standards, not define them — incumbents shouldn't become the hiring “ideal.” Broader, population-based norming (so you rely less on any single team) is on our roadmap.",
      },
    ],
  },
  {
    title: "EEO data & reporting",
    items: [
      {
        q: "How is the voluntary EEO questionnaire handled — is it kept separate from hiring?",
        a: "Yes. Background (EEO) questions are voluntary, stored separately from selection data, and used only in aggregate for fairness monitoring. They are never shown to the people making hiring decisions and are never part of any candidate's result.",
      },
      {
        q: "What reporting do we get across locations and brands?",
        a: "Today you get aggregate fairness reporting, plus per-location and cross-store reporting on the Operator plan. Filing-ready EEO-1 / OFCCP-formatted exports, brand-hierarchy rollup, and audit-ready compliance exports are part of our Enterprise roadmap — tell us what your team needs to produce and we'll scope it.",
      },
      {
        q: "We're a federal contractor — does this help with OFCCP obligations?",
        a: "It's designed to support the recordkeeping and adverse-impact analysis contractors are expected to maintain, and OFCCP-oriented reporting is on the Enterprise roadmap. Exactly which obligations it supports depends on your broader affirmative-action program, so we'd map that with you and your counsel.",
      },
    ],
  },
  {
    title: "AI & hiring laws (LL144, state rules)",
    items: [
      {
        q: "Is QDX an “automated employment decision tool,” and does NYC Local Law 144 apply to us?",
        a: "QDX is built around “score, don't filter”: it surfaces signals and a fit recommendation, but a person on your team makes every decision. That design is directly relevant to laws like NYC Local Law 144, which target tools used to substantially assist or replace human decision-making. Whether a specific law applies depends on the law, how you deploy the tool, and (for LL144) where the candidate lives — so that's a determination for your counsel. LL144 also requires an independent, third-party bias audit (which a vendor can't perform for itself) plus candidate notice; we'll work with you and a qualified auditor and provide the data they need.",
      },
      {
        q: "How do we handle the patchwork of state AI hiring laws?",
        a: "Rules vary by jurisdiction — New York City, Illinois, California, Colorado and others each take a different approach, and most apply based on where the candidate is, not where you're headquartered. The platform is built around the common throughlines: a human in every decision, adverse-impact monitoring, and candidate-facing transparency. We keep an eye on the landscape and will tell you candidly what we support versus what you configure.",
      },
      {
        q: "Do you support candidate notice and a human-review step?",
        a: "Human review is core to the design — you make every call. Candidate notice/disclosure templates and a documented alternative-process pathway (which map to LL144, Illinois, and Colorado-style requirements) are on our roadmap; talk to us about your specific needs.",
      },
    ],
  },
  {
    title: "Data, security & audits",
    items: [
      {
        q: "How is candidate and EEO data stored and separated?",
        a: "Your data is yours — stored in a secure, access-controlled database, used only to run your hiring, and never sold. EEO data is kept separate from selection data and only ever used in aggregate. For a full security and privacy review (encryption, retention, sub-processors), reach out and we'll walk your team through it.",
      },
      {
        q: "Can we produce audit-ready records if we're audited or face a claim?",
        a: "Producing the selection, adverse-impact, and EEO records a regulator or plaintiff would request is a core goal of our Enterprise compliance tooling, and audit-ready exports are on the roadmap. Tell us what you'd need to produce and we'll make sure it's covered.",
      },
    ],
  },
  {
    title: "Roles & responsibilities",
    items: [
      {
        q: "Who's responsible for compliance — QDX or us?",
        a: "It's shared. QDX provides the tooling — adverse-impact monitoring, fairness flags, separated EEO data, and a human-in-the-loop design — but you remain the employer making the decisions, and some obligations (for example, the independent bias audit some jurisdictions require) fall to you and can only be performed by a qualified third party. We recommend spelling this split out in your agreement.",
      },
      {
        q: "Does the assessment accommodate disabilities (ADA)?",
        a: "Every decision is made by a person, and we work with operators on reasonable accommodations for candidates who need an alternative. Built-in accommodation options (alternative formats, extended time, screen-reader-friendly flows) are on our roadmap — if a candidate needs an accommodation today, talk to us and we'll help.",
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
            How QDX is designed to support fair, defensible hiring across your
            locations and brands. Some items below are part of our Enterprise
            roadmap — we&apos;ll always tell you candidly what&apos;s built today
            versus what we&apos;re building.
          </p>

          <p className="mt-6 card text-sm text-[color:var(--brand-ink-muted)] bg-[color:var(--brand-cream)]">
            <strong>Not legal advice.</strong> These answers describe how QDX is
            designed to <em>support</em> compliant hiring; QDX doesn&apos;t
            determine compliance for your business. Hiring laws vary by state and
            city and change often — confirm specifics with your own counsel.
          </p>

          <div className="mt-8 space-y-10">
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
              We&apos;ll walk your talent, legal, and security teams through the
              details.
            </p>
          </div>
        </div>
      </main>
      <ApexFooter />
    </>
  );
}
