import { notFound } from "next/navigation";
import { BrandHeader, BrandFooter } from "@/components/Brand";
import { currentOrg } from "@/lib/tenancy";
import { adminClient, eeoAdmin } from "@/lib/supabase/admin";
import EeoForm from "@/components/EeoForm";
import { saveEeo } from "@/app/eeo/[token]/actions";

interface PageProps {
  params: Promise<{ token: string }>;
}

/**
 * Voluntary EEO self-ID — the separate, final step after the assessment.
 */
export default async function EeoPage({ params }: PageProps) {
  const { token } = await params;
  const org = await currentOrg();
  if (!org) notFound();

  const supa = adminClient();
  const { data: session } = await supa
    .from("assessment_sessions")
    .select("application_id")
    .eq("access_token", token)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!session?.application_id) notFound();

  const { data: existing } = await eeoAdmin()
    .from("responses")
    .select("id")
    .eq("application_id", session.application_id)
    .maybeSingle();

  return (
    <>
      <BrandHeader org={org} />
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
        {existing ? (
          <div className="max-w-lg mx-auto card text-center">
            <div className="text-5xl">✅</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">All set.</h1>
            <p className="mt-3 text-[color:var(--brand-ink-muted)]">
              Thanks for applying to {org.name}. You&apos;re all done.
            </p>
          </div>
        ) : (
          <EeoForm token={token} orgName={org.name} submitAction={saveEeo} />
        )}
      </main>
      <BrandFooter org={org} />
    </>
  );
}
