import { notFound } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import SettingsForm from "@/components/admin/SettingsForm";
import BrandFromUrl from "@/components/admin/BrandFromUrl";

export default async function SettingsPage() {
  const org = await currentOrg();
  if (!org) notFound();
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Branding & wording</h1>
      <p className="text-[color:var(--brand-ink-muted)] mb-6">
        How your hiring page looks to applicants. Changes apply immediately.
      </p>
      <BrandFromUrl />
      <SettingsForm org={org} />
    </div>
  );
}
