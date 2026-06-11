import { notFound } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import { getPrimaryLocation } from "@/lib/locations";
import { orgRoles } from "@/lib/roles";
import LocationForm from "@/components/admin/LocationForm";
import RolesEditor from "@/components/admin/RolesEditor";

export default async function LocationsPage() {
  const org = await currentOrg();
  if (!org) notFound();
  const location = await getPrimaryLocation(org.id);

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Store setup</h1>
      <p className="text-[color:var(--brand-ink-muted)]">
        Your store details and the roles you hire for. Postings and
        applications are tied to this location. (Multi-location comes later.)
      </p>
      <LocationForm location={location} />
      <RolesEditor initialRoles={orgRoles(org.branding)} />
    </div>
  );
}
