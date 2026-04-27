import Link from "next/link";
import { BrandHeader, BrandFooter } from "@/components/Brand";
import { currentOrg } from "@/lib/tenancy";

export default async function ThankYou() {
  const org = await currentOrg();
  return (
    <>
      <BrandHeader org={org} />
      <main className="flex-1 px-4 sm:px-6 py-16">
        <div className="max-w-lg mx-auto card text-center">
          <div className="text-5xl">🍦</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Thanks — you&apos;re done.
          </h1>
          <p className="mt-3 text-[color:var(--brand-ink-muted)]">
            We&apos;ve received your application. {org?.name ?? "The team"}{" "}
            will review it personally and reach out if it&apos;s a fit.
          </p>
          <div className="mt-6">
            <Link href="/" className="btn-ghost">
              Back to start
            </Link>
          </div>
        </div>
      </main>
      <BrandFooter org={org} />
    </>
  );
}
