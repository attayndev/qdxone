import { notFound } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import { getOrgLocations } from "@/lib/locations";
import { orgRolesDetailed } from "@/lib/roles";
import { applicationConfig } from "@/lib/application-config";
import LocationForm from "@/components/admin/LocationForm";
import DeleteLocationButton from "@/components/admin/DeleteLocationButton";
import RolesEditor from "@/components/admin/RolesEditor";
import AssessmentModeToggle from "@/components/admin/AssessmentModeToggle";
import ApplicationFormSettings from "@/components/admin/ApplicationFormSettings";
import CustomQuestionsEditor from "@/components/admin/CustomQuestionsEditor";

export default async function LocationsPage() {
  const org = await currentOrg();
  if (!org) notFound();
  const locations = await getOrgLocations(org.id);

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Store setup</h1>
      <p className="text-[color:var(--brand-ink-muted)]">
        Your stores and the roles you hire for. Postings and applications are
        tied to a store. Add a second store to unlock Operator features — one
        login, a shared hiring page, and reports across all your stores.
      </p>

      <div className="mt-6 space-y-4">
        <h2 className="font-extrabold text-lg">
          {locations.length <= 1 ? "Your store" : `Your stores (${locations.length})`}
        </h2>
        {locations.length === 0 && (
          <p className="text-sm text-[color:var(--brand-ink-muted)]">
            Add your first store to start taking applications.
          </p>
        )}
        {locations.map((loc) => (
          <div key={loc.id}>
            <LocationForm location={loc} />
            <div className="mt-2 max-w-2xl flex justify-end">
              <DeleteLocationButton id={loc.id} name={loc.name} />
            </div>
          </div>
        ))}

        <details className="max-w-2xl">
          <summary className="cursor-pointer font-semibold text-[color:var(--brand-pink-600)]">
            + Add {locations.length === 0 ? "a store" : "another store"}
          </summary>
          <LocationForm location={null} />
        </details>
      </div>

      <RolesEditor initial={orgRolesDetailed(org.branding)} />
      <ApplicationFormSettings config={applicationConfig(org.branding)} />
      <CustomQuestionsEditor
        initial={applicationConfig(org.branding).custom_questions}
      />
      <AssessmentModeToggle
        autoSend={org.branding?.auto_send_assessment !== false}
      />
    </div>
  );
}
