import { notFound } from "next/navigation";
import Link from "next/link";
import { BrandHeader, BrandFooter } from "@/components/Brand";
import { currentOrg } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import { roleDescription } from "@/lib/roles";

interface PageProps {
  params: Promise<{ token: string }>;
}

/**
 * Public job posting landing (per-org subdomain). The candidate scans the
 * QR / opens the link and starts the application here.
 */
export default async function JobPostingPage({ params }: PageProps) {
  const { token } = await params;
  const org = await currentOrg();
  if (!org) notFound();

  const supa = adminClient();
  const { data: posting } = await supa
    .from("job_postings")
    .select("id, title, status, org_id")
    .eq("public_token", token)
    .eq("org_id", org.id)
    .maybeSingle();

  if (!posting || posting.status !== "open") notFound();

  return (
    <>
      <BrandHeader org={org} />
      <main className="flex-1 px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-2xl mx-auto">
          <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)]">
            Now hiring
          </span>
          <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {posting.title}
          </h1>
          <p className="mt-3 text-lg text-[color:var(--brand-ink-muted)]">
            at <strong>{org.name}</strong>
          </p>

          {roleDescription(org.branding, posting.title) && (
            <p className="mt-5 text-[15px] leading-relaxed whitespace-pre-line">
              {roleDescription(org.branding, posting.title)}
            </p>
          )}

          <div className="card mt-8">
            <h2 className="font-extrabold text-lg">How it works</h2>
            <ul className="mt-3 space-y-2 text-[15px] leading-relaxed">
              <li>• A short application — name, contact, availability. ~3 minutes.</li>
              <li>• Then a quick assessment, about 5 minutes, on your phone.</li>
              <li>• That&apos;s it. The manager reviews and reaches out.</li>
            </ul>
          </div>

          <div className="mt-8">
            <Link
              href={`/apply/${encodeURIComponent(token)}`}
              className="btn-primary"
            >
              Start your application
            </Link>
          </div>
        </div>
      </main>
      <BrandFooter org={org} />
    </>
  );
}
