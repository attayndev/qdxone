import Link from "next/link";
import { BrandMark } from "@/components/Brand";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import { currentOrg } from "@/lib/tenancy";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supa = await createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  const org = await currentOrg();

  return (
    <>
      <header className="w-full px-4 sm:px-6 py-3 border-b border-[color:var(--brand-line)] bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/admin" className="block">
            <BrandMark org={org} override={{ subtitle: "Admin" }} />
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-sm">
            <Link
              href="/admin"
              className="font-semibold hover:text-[color:var(--brand-pink)]"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/postings"
              className="font-semibold hover:text-[color:var(--brand-pink)]"
            >
              Postings
            </Link>
            <Link
              href="/admin/candidates"
              className="font-semibold hover:text-[color:var(--brand-pink)]"
            >
              Candidates
            </Link>
            <Link
              href="/admin/reports"
              className="font-semibold hover:text-[color:var(--brand-pink)]"
            >
              Reports
            </Link>
            <Link
              href="/admin/eeo"
              className="font-semibold hover:text-[color:var(--brand-pink)]"
            >
              Fairness
            </Link>
            <Link
              href="/admin/locations"
              className="font-semibold hover:text-[color:var(--brand-pink)]"
            >
              Store
            </Link>
            <Link
              href="/admin/settings"
              className="font-semibold hover:text-[color:var(--brand-pink)]"
            >
              Settings
            </Link>
            <Link
              href="/admin/billing"
              className="font-semibold hover:text-[color:var(--brand-pink)]"
            >
              Billing
            </Link>
            {user && (
              <>
                <span className="hidden sm:inline text-[color:var(--brand-ink-muted)]">
                  {user.email}
                </span>
                <LogoutButton />
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </>
  );
}
