import { currentOrg } from "@/lib/tenancy";
import { BrandMark } from "@/components/Brand";

/**
 * The employee (/staff) shell — deliberately separate from the admin layout.
 * No admin nav; employees only ever see their own thing.
 */
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const org = await currentOrg();
  return (
    <>
      <header className="w-full px-4 sm:px-6 py-3 border-b border-[color:var(--brand-line)] bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <BrandMark org={org} override={{ subtitle: "My schedule" }} />
        </div>
      </header>
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto">{children}</div>
      </main>
    </>
  );
}
