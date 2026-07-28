import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { BrandMark } from "@/components/Brand";
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
    <div className="md:flex md:min-h-screen">
      <AdminSidebar
        brand={<BrandMark org={org} override={{ subtitle: "Admin" }} />}
        userEmail={user?.email}
        logout={<LogoutButton />}
      />
      <div className="flex-1 min-w-0">
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
