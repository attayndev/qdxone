import { notFound } from "next/navigation";
import Link from "next/link";
import { BrandHeader, BrandFooter } from "@/components/Brand";
import { currentOrg } from "@/lib/tenancy";
import { loadAssessment } from "@/lib/assessment/session";
import AssessmentRunner from "@/components/AssessmentRunner";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AssessmentPage({ params }: PageProps) {
  const { token } = await params;
  const org = await currentOrg();
  if (!org) notFound();

  const result = await loadAssessment(token);

  if (result.status === "not_found") notFound();

  return (
    <>
      <BrandHeader org={org} />
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
        {result.status === "ok" ? (
          <AssessmentRunner
            token={token}
            items={result.items}
            answered={result.answered}
          />
        ) : (
          <div className="max-w-lg mx-auto card text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {result.status === "complete"
                ? "You've already completed this."
                : "This assessment link has expired."}
            </h1>
            <p className="mt-3 text-[color:var(--brand-ink-muted)]">
              {result.status === "complete"
                ? "Thanks — we have your responses. The team will be in touch."
                : `Links stay valid for 72 hours. Contact ${org.name} to get a fresh one.`}
            </p>
            <div className="mt-6">
              <Link href="/" className="btn-ghost">
                Back to start
              </Link>
            </div>
          </div>
        )}
      </main>
      <BrandFooter org={org} />
    </>
  );
}
