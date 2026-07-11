import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";
import { LEGAL_EMAIL } from "@/lib/legal";

export const metadata = {
  title: "Delete your QDXone account",
  description: "How to delete your QDXone account and what happens to your data.",
};

export default function DeleteAccountPage() {
  return (
    <>
      <ApexHeader />
      <main className="flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-2xl mx-auto text-[15px] leading-relaxed text-[color:var(--brand-ink)]">
          <h1 className="text-3xl font-black tracking-tight">Delete your account</h1>
          <p className="mt-4">
            You can delete your QDXone operator account at any time. This removes your
            account and personal information — your name, email, sign-in, and device
            push tokens.
          </p>

          <h2 className="text-xl font-extrabold tracking-tight mt-8 mb-2">In the app</h2>
          <p>
            Open the QDXone Operator app → <strong>Account</strong> →{" "}
            <strong>Delete account</strong>, then confirm. Your account is deleted
            immediately and you&apos;re signed out.
          </p>

          <h2 className="text-xl font-extrabold tracking-tight mt-8 mb-2">By request</h2>
          <p>
            Prefer we handle it? Email{" "}
            <a href={`mailto:${LEGAL_EMAIL}?subject=Delete%20my%20account`} className="underline text-[color:var(--brand-blue-600)]">
              {LEGAL_EMAIL}
            </a>{" "}
            from your account email and we&apos;ll delete it within 30 days.
          </p>

          <h2 className="text-xl font-extrabold tracking-tight mt-8 mb-2">What is deleted, and what is kept</h2>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Deleted:</strong> your login, name, email, and push-notification tokens.</li>
            <li>
              <strong>Kept:</strong> business records that belong to your employer — the
              restaurant&apos;s job postings and its applicants&apos; records. Under our{" "}
              <a href="/privacy" className="underline text-[color:var(--brand-blue-600)]">Privacy Policy</a>, the
              employer is the controller of that hiring data; deleting your operator
              account does not delete the employer&apos;s data. If you are the account
              owner and want the whole organization and its data removed, say so in your
              request.
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
