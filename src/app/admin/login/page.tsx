import { Suspense } from "react";
import { BrandHeader, BrandFooter } from "@/components/Brand";
import LoginForm from "@/components/LoginForm";
import DevSignIn from "@/components/DevSignIn";
import { currentOrg } from "@/lib/tenancy";

interface PageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const org = await currentOrg();
  return (
    <>
      <BrandHeader org={org} showApply={false} />
      <main className="flex-1 px-4 sm:px-6 py-16">
        <div className="max-w-md mx-auto card">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Manager sign-in
          </h1>
          <p className="text-[color:var(--brand-ink-muted)] mt-1 text-sm">
            We&apos;ll email you a one-time link.
          </p>
          {sp.error === "not_member" && (
            <p className="mt-3 text-sm text-red-600">
              That account isn&apos;t a member of this organization.
            </p>
          )}
          {sp.error === "unknown_org" && (
            <p className="mt-3 text-sm text-red-600">
              We don&apos;t recognize this subdomain.
            </p>
          )}
          <div className="mt-5">
            <Suspense>
              <LoginForm next={sp.next ?? "/admin"} />
            </Suspense>
          </div>
          {process.env.NODE_ENV !== "production" && (
            <DevSignIn defaultSlug={org?.slug} />
          )}
        </div>
      </main>
      <BrandFooter org={org} />
    </>
  );
}
