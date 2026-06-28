import { createClient } from "@/lib/supabase/server";
import { StoreMenu } from "@/components/admin/StoreMenu";
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
        <div className="max-w-6xl mx-auto flex items-center">
          <StoreMenu org={org} userEmail={user?.email} />
        </div>
      </header>
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </>
  );
}
