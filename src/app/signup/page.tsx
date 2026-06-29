import { ROOT_DOMAIN } from "@/lib/tenancy";
import SignupForm from "@/components/SignupForm";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";

export default function SignupPage() {
  return (
    <>
      <ApexHeader active="/signup" />

      <main className="flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Start hiring smarter.
          </h1>
          <p className="text-[color:var(--brand-ink-muted)] mt-2">
            30-day free trial on every plan. Pick a name, claim your
            subdomain, and we&apos;ll email you a magic link to finish.
          </p>

          <div className="card mt-6">
            <SignupForm rootDomain={ROOT_DOMAIN} />
          </div>

          <p className="mt-4 text-xs text-[color:var(--brand-ink-muted)] text-center">
            By signing up you agree to our{" "}
            <a href="/terms" className="underline">Terms of Service</a> and{" "}
            <a href="/privacy" className="underline">Privacy Policy</a>. You can
            change your plan or cancel any time.
          </p>
        </div>
      </main>
      <ApexFooter />
    </>
  );
}
