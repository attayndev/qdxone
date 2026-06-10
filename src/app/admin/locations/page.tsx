import { notFound } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import { getPrimaryLocation } from "@/lib/locations";
import LocationForm from "@/components/admin/LocationForm";

export default async function LocationsPage() {
  const org = await currentOrg();
  if (!org) notFound();
  const location = await getPrimaryLocation(org.id);

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Store profile</h1>
      <p className="text-[color:var(--brand-ink-muted)]">
        Your store details. Postings and applications are tied to this
        location. (Multi-location support comes later.)
      </p>
      <LocationForm location={location} />
    </div>
  );
}
