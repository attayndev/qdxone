import { notFound, redirect } from "next/navigation";
import { BrandHeader, BrandFooter } from "@/components/Brand";
import { lookupInvitation, bumpInvitationStatus } from "@/lib/invitations";
import Questionnaire from "@/components/Questionnaire";
import { buildQuestions } from "@/lib/questionnaire/schema";
import { submitApplication } from "@/app/apply/[token]/actions";
import { currentOrg } from "@/lib/tenancy";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ApplyPage({ params }: PageProps) {
  const { token } = await params;
  const org = await currentOrg();
  if (!org) notFound();
  const result = await lookupInvitation(token, org.id);

  if (!result.ok) {
    if (result.reason === "submitted") {
      redirect(`/apply/${encodeURIComponent(token)}/thank-you`);
    }
    notFound();
  }

  await bumpInvitationStatus(token, "started");
  const inv = result.invitation;
  const questions = buildQuestions(org.branding);

  return (
    <>
      <BrandHeader org={org} />
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
        <div className="max-w-xl mx-auto">
          <Questionnaire
            token={token}
            questions={questions}
            prefill={{
              first_name: inv.first_name ?? "",
              last_name: inv.last_name ?? "",
              email: inv.email ?? "",
              phone: inv.phone ?? "",
            }}
            submitAction={submitApplication}
          />
        </div>
      </main>
      <BrandFooter org={org} />
    </>
  );
}
