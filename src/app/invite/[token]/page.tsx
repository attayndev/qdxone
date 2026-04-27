import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandHeader, BrandFooter } from "@/components/Brand";
import { lookupInvitation, bumpInvitationStatus } from "@/lib/invitations";
import { currentOrg } from "@/lib/tenancy";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InviteWelcome({ params }: PageProps) {
  const { token } = await params;
  const org = await currentOrg();
  if (!org) notFound();
  const result = await lookupInvitation(token, org.id);
  const phoneRule = org.branding.phone_policy_enabled !== false;
  const phoneRuleText =
    org.branding.phone_policy_text ??
    "Phones live in the office during shifts. Phone use on the floor is a firing offense.";

  if (!result.ok) {
    return (
      <>
        <BrandHeader org={org} />
        <main className="flex-1 px-4 sm:px-6 py-16">
          <div className="max-w-lg mx-auto card text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {result.reason === "submitted"
                ? "You've already submitted this application."
                : result.reason === "expired"
                  ? "This invitation has expired."
                  : "We couldn't find that invitation."}
            </h1>
            <p className="mt-3 text-[color:var(--brand-ink-muted)]">
              {result.reason === "submitted"
                ? "Thanks for applying — we have your responses. We'll be in touch."
                : `If you believe you should have access, contact ${org.name}.`}
            </p>
            <div className="mt-6">
              <Link href="/" className="btn-ghost">
                Back to start
              </Link>
            </div>
          </div>
        </main>
        <BrandFooter org={org} />
      </>
    );
  }

  await bumpInvitationStatus(token, "opened");
  const inv = result.invitation;
  const firstName = inv.first_name?.trim();

  return (
    <>
      <BrandHeader org={org} />
      <main className="flex-1 px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-2xl mx-auto">
          <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)]">
            You&apos;re invited
          </span>
          <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {firstName ? `Hey ${firstName} 👋` : "Hey there 👋"}
            <br />
            <span className="text-[color:var(--brand-pink)]">
              Welcome to your application.
            </span>
          </h1>

          <p className="mt-5 text-lg text-[color:var(--brand-ink-muted)]">
            This is a short pre-interview questionnaire — about{" "}
            <strong>5 to 7 minutes</strong>. Be honest. We&apos;d rather
            know now than find out later.
          </p>

          <div className="card mt-8">
            <h2 className="font-extrabold text-lg">Before you start</h2>
            <ul className="mt-3 space-y-2 text-[color:var(--brand-ink)] text-[15px] leading-relaxed">
              <li>• Answer based on real experiences — school, sports, clubs, family stuff, jobs. All count.</li>
              <li>• Short, honest answers beat long, polished ones.</li>
              <li>• You&apos;ll see one question at a time. No back button needed — just go.</li>
              {phoneRule && <li>• Reminder: {phoneRuleText}</li>}
            </ul>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/apply/${encodeURIComponent(token)}`}
              className="btn-primary"
            >
              Start the questionnaire
            </Link>
            <Link href="/" className="btn-ghost">
              Not yet
            </Link>
          </div>
        </div>
      </main>
      <BrandFooter org={org} />
    </>
  );
}
