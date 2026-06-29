import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";
import {
  LEGAL_ENTITY,
  LEGAL_SHORT,
  GOVERNING_STATE,
  LEGAL_EMAIL,
  TERMS_EFFECTIVE,
} from "@/lib/legal";

export const metadata = {
  title: "QDX One — Terms of Service",
  description: "The terms that govern use of the QDXone hiring platform.",
};

function H({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-extrabold tracking-tight mt-8 mb-2">
      {n}. {children}
    </h2>
  );
}

export default function TermsPage() {
  return (
    <>
      <ApexHeader />
      <main className="flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-3xl mx-auto prose-legal text-[15px] leading-relaxed text-[color:var(--brand-ink)]">
          <h1 className="text-3xl font-black tracking-tight">Terms of Service</h1>
          <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
            Effective {TERMS_EFFECTIVE}
          </p>

          <p className="mt-6">
            These Terms of Service (the &ldquo;Terms&rdquo;) are a binding agreement between
            you and {LEGAL_ENTITY} (&ldquo;{LEGAL_SHORT},&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;).
            They govern your access to and use of the QDXone websites, applications,
            and services (together, the &ldquo;Service&rdquo;). By creating an account,
            clicking &ldquo;agree,&rdquo; or using the Service, you accept these Terms. If
            you are agreeing on behalf of a business, you represent that you are
            authorized to bind that business.
          </p>

          <H n={1}>The Service</H>
          <p>
            QDXone is a hiring platform for restaurants and similar employers. It
            lets you publish job postings, receive applications, send applicants a
            short assessment, and review results to help you decide whom to
            interview and hire. The assessment provides decision-support scores and
            signals; it does not make hiring decisions. <strong>You are the employer
            and you make all hiring decisions.</strong>
          </p>

          <H n={2}>Accounts &amp; eligibility</H>
          <p>
            You must provide accurate account information and keep it current. You
            are responsible for activity under your account and for keeping access
            credentials secure. You must be at least 18 years old and able to form a
            binding contract. You may invite team members; you are responsible for
            their use of the Service.
          </p>

          <H n={3}>Subscriptions, trials &amp; billing</H>
          <p>
            Paid plans are billed in advance on a recurring basis (monthly or
            annually) through our payment processor. Free trials, where offered,
            convert to a paid subscription unless cancelled before the trial ends.
            Fees are based on your plan and may scale with usage (for example, the
            number of locations). You can cancel at any time, effective at the end
            of the current billing period; except where required by law, fees
            already paid are non-refundable. We may change pricing on prospective
            notice.
          </p>

          <H n={4}>Acceptable use</H>
          <p>You agree not to, and not to allow anyone to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>use the Service for any unlawful, discriminatory, or fraudulent purpose;</li>
            <li>
              use assessment results as the sole basis for an adverse employment
              decision, or in any way that violates equal-employment, fair-hiring,
              fair-credit, or anti-discrimination laws;
            </li>
            <li>misrepresent a job, an employer, or the nature of an application;</li>
            <li>
              upload unlawful, infringing, or malicious content, or attempt to
              breach, probe, or disrupt the Service or its security;
            </li>
            <li>
              scrape, resell, or provide the Service to third parties except your own
              hiring, or reverse engineer the Service except as permitted by law.
            </li>
          </ul>

          <H n={5}>Your data &amp; your responsibilities as an employer</H>
          <p>
            You retain ownership of the data you and your applicants submit
            (&ldquo;Customer Data&rdquo;). You grant us a license to host, process, and
            use Customer Data to provide and improve the Service and as described in
            our{" "}
            <a href="/privacy" className="underline text-[color:var(--brand-pink-600)]">
              Privacy Policy
            </a>
            . You are responsible for collecting and using applicant data lawfully —
            including providing any required notices and complying with the EEOC, the
            FCRA where applicable, and federal, state, and local employment and
            privacy laws. QDXone is a tool that supports your judgment; the hiring
            decision, and responsibility for it, is yours.
          </p>

          <H n={6}>Our intellectual property; license to you</H>
          <p>
            We and our licensors own the Service, including its software,
            assessments, item banks, scoring methodology, and content. Subject to
            these Terms, we grant you a limited, non-exclusive, non-transferable,
            revocable license to access and use the Service for your internal hiring
            during your subscription. No other rights are granted.
          </p>

          <H n={7}>Disclaimers</H>
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            warranties of any kind, express or implied, including merchantability,
            fitness for a particular purpose, and non-infringement. Assessments are
            probabilistic decision-support tools; we do not warrant that any score
            predicts job performance in your specific context or that the Service is
            error-free or uninterrupted.
          </p>

          <H n={8}>Limitation of liability</H>
          <p>
            To the maximum extent permitted by law, neither party is liable for
            indirect, incidental, special, consequential, or punitive damages, or for
            lost profits or revenues. Our total liability arising out of or relating
            to the Service will not exceed the amounts you paid us for the Service in
            the twelve months before the event giving rise to the claim.
          </p>

          <H n={9}>Indemnification</H>
          <p>
            You will defend and indemnify {LEGAL_SHORT} against third-party claims
            arising from your Customer Data, your hiring decisions, or your violation
            of these Terms or applicable law.
          </p>

          <H n={10}>Term &amp; termination</H>
          <p>
            These Terms apply while you use the Service. You may stop using it at any
            time. We may suspend or terminate access for breach of these Terms,
            non-payment, or to comply with law. On termination, your license ends; we
            handle remaining Customer Data as described in the Privacy Policy.
          </p>

          <H n={11}>Changes to these Terms</H>
          <p>
            We may update these Terms. If we make material changes, we will update the
            effective date and, where appropriate, give notice. Continued use after
            changes take effect means you accept the revised Terms.
          </p>

          <H n={12}>Governing law</H>
          <p>
            These Terms are governed by the laws of the State of {GOVERNING_STATE},
            without regard to its conflict-of-laws rules. The state and federal courts
            located in {GOVERNING_STATE} will have exclusive jurisdiction, and the
            parties consent to venue there.
          </p>

          <H n={13}>Contact</H>
          <p>
            Questions about these Terms?{" "}
            <a href={`mailto:${LEGAL_EMAIL}`} className="underline text-[color:var(--brand-pink-600)]">
              {LEGAL_EMAIL}
            </a>
            .
          </p>
        </div>
      </main>
      <ApexFooter />
    </>
  );
}
