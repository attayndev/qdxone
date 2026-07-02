import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { ApexHeader, ApexFooter } from "@/components/apex/ApexHeader";
import { createClient } from "@/lib/supabase/server";
import { resolveHomeUrl } from "@/lib/auth/home-route";

interface PageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

/**
 * Apex sign-in. Sends a magic link; the auth callback then routes the
 * signed-in user to their org's subdomain admin. If already signed in, route
 * straight to their home (so /admin on the apex doesn't dead-end on this form).
 */
export default async function ApexLoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const supa = await createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (user) {
    const home = await resolveHomeUrl(user);
    if (!home.includes("/login")) redirect(home); // guard the no-org loop
  }

  return (
    <>
      <ApexHeader />

      <main className="flex-1 px-4 sm:px-6 py-16">
        <div className="max-w-md mx-auto card">
          <h1 className="text-2xl font-extrabold tracking-tight">Sign in</h1>
          <p className="text-[color:var(--brand-ink-muted)] mt-1 text-sm">
            We&apos;ll email you a one-time link.
          </p>
          {sp.error && (
            <p className="mt-3 text-sm text-red-600">
              {sp.error === "no_org"
                ? "No organization is linked to that account."
                : "Sign in failed. Try again."}
            </p>
          )}
          <div className="mt-5">
            <Suspense>
              <LoginForm next="/admin" />
            </Suspense>
          </div>
          <p className="mt-5 text-sm text-[color:var(--brand-ink-muted)]">
            Don&apos;t have an account yet?{" "}
            <Link href="/signup" className="text-[color:var(--brand-blue-600)] underline">
              Start free
            </Link>
            .
          </p>
        </div>
      </main>
      <ApexFooter />
    </>
  );
}
