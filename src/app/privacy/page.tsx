import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";
import {
  LEGAL_ENTITY,
  LEGAL_SHORT,
  LEGAL_EMAIL,
  TERMS_EFFECTIVE,
} from "@/lib/legal";

export const metadata = {
  title: "QDX One — Privacy Policy",
  description: "How QDXone collects, uses, and protects personal information.",
};

function H({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-extrabold tracking-tight mt-8 mb-2">
      {n}. {children}
    </h2>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <ApexHeader />
      <main className="flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-3xl mx-auto text-[15px] leading-relaxed text-[color:var(--brand-ink)]">
          <h1 className="text-3xl font-black tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
            Effective {TERMS_EFFECTIVE}
          </p>

          <p className="mt-6">
            This Privacy Policy explains how {LEGAL_ENTITY} (&ldquo;{LEGAL_SHORT},&rdquo;
            &ldquo;we,&rdquo; &ldquo;us&rdquo;) handles personal information in connection with
            the QDXone hiring platform (the &ldquo;Service&rdquo;).
          </p>

          <H n={1}>Two kinds of users</H>
          <p>
            <strong>Employers</strong> (restaurant owners and their teams) use QDXone
            to hire. <strong>Applicants</strong> apply to those employers and take a
            short assessment. For applicant data, the employer is the
            &ldquo;controller&rdquo; (it decides why the data is collected) and QDXone
            acts as its service provider/&ldquo;processor.&rdquo; Applicants exercising
            data rights about a specific application should contact that employer; we
            will assist them.
          </p>

          <H n={2}>Information we collect</H>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Employer account data</strong> — name, email, business name, login and billing details.</li>
            <li><strong>Applicant data</strong> — the information an applicant submits (such as name, contact details, work history, and answers to an employer&apos;s questions).</li>
            <li><strong>Assessment responses</strong> — answers used to generate decision-support scores.</li>
            <li><strong>Voluntary EEO self-identification</strong> — where offered, demographic information an applicant chooses to provide. See section 5.</li>
            <li><strong>Usage &amp; device data</strong> — log data needed to operate and secure the Service.</li>
          </ul>

          <H n={3}>How we use information</H>
          <p>
            To provide, secure, and improve the Service; to deliver assessments and
            results to the relevant employer; to communicate about your account; to
            process payments; and to comply with law. We do not sell personal
            information, and we do not use applicant data for advertising.
          </p>

          <H n={4}>Service providers (subprocessors)</H>
          <p>
            We use trusted vendors to run the Service, under contracts that limit
            their use of data to providing services to us: hosting and database
            (Supabase, Cloudflare), email (Resend), text messaging (Telnyx), payment
            processing (Stripe), AI text generation for job descriptions (Anthropic),
            and calendar scheduling at your direction (Google). Calendar access
            tokens are encrypted at rest, and we read only free/busy availability —
            never the contents of your calendar.
          </p>

          <H n={5}>Voluntary EEO data is kept separate</H>
          <p>
            When an applicant chooses to provide equal-employment-opportunity
            self-identification, that data is stored in an isolated partition and is
            <strong> never shown to decision-makers as individual records</strong>. It
            is used only to produce aggregate, anonymized fairness reporting, with
            small groups suppressed so individuals cannot be identified. It is not
            used to score, rank, or screen any applicant.
          </p>

          <H n={6}>Retention</H>
          <p>
            We keep personal information for as long as needed to provide the Service
            and for legitimate legal, compliance, and recordkeeping purposes, then
            delete or de-identify it. Employers may request deletion of their
            workspace data, subject to legal retention requirements.
          </p>

          <H n={7}>Your choices &amp; rights</H>
          <p>
            Depending on your location, you may have rights to access, correct,
            delete, or port your personal information, or to object to certain
            processing. Employers can manage account data in-product or by contacting
            us. Applicants should contact the employer they applied to; we will
            support that employer in responding.
          </p>

          <H n={8}>Security</H>
          <p>
            We use administrative, technical, and organizational safeguards —
            including encryption in transit, encryption of sensitive tokens at rest,
            row-level access controls, and tenant isolation — to protect personal
            information. No system is perfectly secure, but we work to protect your
            data and to notify affected parties as required by law if an incident
            occurs.
          </p>

          <H n={9}>Children</H>
          <p>
            The Service is not intended for individuals under 16, and we do not
            knowingly collect their personal information.
          </p>

          <H n={10}>Changes</H>
          <p>
            We may update this Policy; we will revise the effective date and, for
            material changes, provide notice where appropriate.
          </p>

          <H n={11}>Contact</H>
          <p>
            Privacy questions or requests?{" "}
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
