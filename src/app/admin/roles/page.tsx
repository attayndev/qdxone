import { notFound } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import { orgRolesDetailed } from "@/lib/roles";
import RolesEditor from "@/components/admin/RolesEditor";

export default async function RolesPage() {
  const org = await currentOrg();
  if (!org) notFound();

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Roles</h1>
      <p className="text-[color:var(--brand-ink-muted)] max-w-2xl">
        The jobs you hire for. Each role can carry a job description (write it or
        let AI draft it from a few bullet points), and your postings pick from
        this list.
      </p>
      <div className="mt-6">
        <RolesEditor initial={orgRolesDetailed(org.branding)} />
      </div>
    </div>
  );
}
