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
          <div className="text-5xl">✅</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Application received!
          </h1>
          <p className="mt-3 text-[color:var(--brand-ink-muted)]">
            Thanks for applying to {org?.name ?? "the team"}. Next, keep an eye
            on your email and texts for a short assessment — about 5 minutes,
            on your phone. Finishing it helps us get to know you faster.
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
