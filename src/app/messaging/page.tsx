import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";
import { LEGAL_ENTITY, LEGAL_EMAIL, TERMS_EFFECTIVE } from "@/lib/legal";
import { smsConsentDisclosure } from "@/lib/consent";

export const metadata = {
  title: "QDX One — Text Messaging (SMS) Terms",
  description:
    "How QDXone text messaging works: what we send, how you opt in and out, message frequency, rates, and privacy.",
};

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-extrabold tracking-tight mt-8 mb-2">{children}</h2>
  );
}

export default function MessagingPage() {
  return (
    <>
      <ApexHeader />
      <main className="flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-3xl mx-auto text-[15px] leading-relaxed text-[color:var(--brand-ink)]">
          <h1 className="text-3xl font-black tracking-tight">Text messaging (SMS) terms</h1>
          <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
            Effective {TERMS_EFFECTIVE}
          </p>

          <p className="mt-6">
            When you apply to a restaurant that uses QDXone, that employer can send
            you <strong>text messages about your application</strong> — using{" "}
            {LEGAL_ENTITY} and our messaging provider, Telnyx. This page explains
            exactly how it works. It is plain and simple on purpose.
          </p>

          <H>How you opt in</H>
          <p>
            Texts are <strong>optional</strong>. You&apos;re never texted unless you
            check the box yourself on the job application. Nothing about applying or
            being hired depends on it. This is the exact box and wording you see:
          </p>
          <div className="mt-3 rounded-xl border border-[color:var(--brand-line)] bg-[color:var(--brand-cream)] p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-2 border-[color:var(--brand-blue)]" />
              <div className="text-sm">
                <span className="font-semibold">Text me about this application</span>{" "}
                <span className="text-[color:var(--brand-ink-muted)]">(optional)</span>
                <span className="block text-xs text-[color:var(--brand-ink-muted)] mt-0.5">
                  {smsConsentDisclosure("[Your restaurant]")} See our Terms and Privacy Policy.
                </span>
              </div>
            </div>
          </div>

          <H>What we send</H>
          <p>
            Only messages tied to your application, such as your{" "}
            <strong>assessment link</strong> and <strong>status updates</strong>. No
            ads, no marketing, no messages you didn&apos;t ask for.
          </p>

          <H>How often</H>
          <p>
            Message frequency varies — typically a handful of messages per
            application (roughly 1–5).
          </p>

          <H>Cost</H>
          <p>
            <strong>Message and data rates may apply</strong>, depending on your
            mobile plan. QDXone does not charge you to receive these texts.
          </p>

          <H>How to stop, or get help</H>
          <p>
            Reply <strong>STOP</strong> at any time to stop all texts. Reply{" "}
            <strong>HELP</strong> for help, or email{" "}
            <a href={`mailto:${LEGAL_EMAIL}`} className="underline text-[color:var(--brand-blue-600)]">
              {LEGAL_EMAIL}
            </a>
            .
          </p>

          <H>Your privacy</H>
          <p>
            Your phone number and opt-in are used <strong>only</strong> to send you
            these application messages. We do not sell this information, and{" "}
            <strong>
              no mobile information (phone numbers or SMS opt-in/consent) is shared
              with third parties or affiliates for their own marketing or promotional
              purposes.
            </strong>{" "}
            Full details are in our{" "}
            <a href="/privacy" className="underline text-[color:var(--brand-blue-600)]">
              Privacy Policy
            </a>
            .
          </p>

          <H>Example messages</H>
          <ul className="list-disc pl-6 space-y-1 mt-2 text-[color:var(--brand-ink-muted)]">
            <li>
              &ldquo;Sam, finish your Joe&apos;s Pizza application (via QDX) with a
              quick 5-minute assessment: https://qdx.one/a/… (valid 72h). Reply STOP
              to opt out, HELP for help.&rdquo;
            </li>
            <li>
              &ldquo;Joe&apos;s Pizza (via QDX): you&apos;ve moved forward on your
              application — we&apos;ll be in touch about next steps. Reply STOP to opt
              out.&rdquo;
            </li>
          </ul>

          <p className="mt-8 text-sm text-[color:var(--brand-ink-muted)]">
            Questions? Email{" "}
            <a href={`mailto:${LEGAL_EMAIL}`} className="underline text-[color:var(--brand-blue-600)]">
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
