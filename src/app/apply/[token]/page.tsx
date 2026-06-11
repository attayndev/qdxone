import { notFound } from "next/navigation";
import { BrandHeader, BrandFooter } from "@/components/Brand";
import { currentOrg } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import { applicationConfig } from "@/lib/application-config";
import ApplicationForm from "@/components/ApplicationForm";
import { submitApplication } from "@/app/apply/[token]/actions";

interface PageProps {
  params: Promise<{ token: string }>;
}

/**
 * Inbound application form, keyed on a job posting's public token.
 * (Replaces the legacy invitation-based flow.)
 */
export default async function ApplyPage({ params }: PageProps) {
  const { token } = await params;
  const org = await currentOrg();
  if (!org) notFound();

  const supa = adminClient();
  const { data: posting } = await supa
    .from("job_postings")
    .select("title, status")
    .eq("public_token", token)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!posting || posting.status !== "open") notFound();

  return (
    <>
      <BrandHeader org={org} />
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
        <ApplicationForm
          token={token}
          postingTitle={posting.title}
          config={applicationConfig(org.branding)}
          submitAction={submitApplication}
        />
      </main>
      <BrandFooter org={org} />
    </>
  );
}
