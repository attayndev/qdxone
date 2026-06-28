import Link from "next/link";
import { BrandMark } from "@/components/Brand";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import { currentOrg } from "@/lib/tenancy";

const ITEM =
  "px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[color:var(--brand-cream)] whitespace-nowrap";

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
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* The store name + logo IS the menu — everything lives behind one click. */}
          <details className="relative">
            <summary className="flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <BrandMark org={org} override={{ subtitle: "Admin" }} />
              <span className="text-[color:var(--brand-ink-muted)] text-sm" aria-hidden>
                ▾
              </span>
            </summary>
            <div className="absolute left-0 mt-3 z-30 min-w-[220px] flex flex-col bg-[color:var(--brand-surface)] border border-[color:var(--brand-line)] rounded-2xl shadow-lg p-2">
              <Link href="/admin" className={ITEM}>
                Dashboard
              </Link>
              <Link href="/admin/candidates" className={ITEM}>
                Candidates
              </Link>
              <Link href="/admin/postings" className={ITEM}>
                Postings
              </Link>
              <Link href="/admin/roles" className={ITEM}>
                Roles
              </Link>
              <div className="my-1.5 border-t border-[color:var(--brand-line)]" />
              <Link href="/admin/locations" className={ITEM}>
                Store
              </Link>
              <Link href="/admin/settings" className={ITEM}>
                Page &amp; branding
              </Link>
              <Link href="/admin/team" className={ITEM}>
                Team
              </Link>
              <Link href="/admin/reports" className={ITEM}>
                Reports
              </Link>
              <Link href="/admin/eeo" className={ITEM}>
                Fairness
              </Link>
              <Link href="/admin/billing" className={ITEM}>
                Billing
              </Link>
              <div className="my-1.5 border-t border-[color:var(--brand-line)]" />
              {user && (
                <div className="px-3 pb-1 text-xs text-[color:var(--brand-ink-muted)] truncate">
                  {user.email}
                </div>
              )}
              <div className="px-1">
                <LogoutButton />
              </div>
            </div>
          </details>

          <Link href="/admin/postings" className="btn-primary text-sm whitespace-nowrap">
            + New posting
          </Link>
        </div>
      </header>
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </>
  );
}
