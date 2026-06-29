import { notFound } from "next/navigation";
import { BrandHeader, BrandFooter } from "@/components/Brand";
import { BrandTheme } from "@/components/BrandTheme";
import { currentOrg, orgUrl } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import { applicationConfig } from "@/lib/application-config";
import { jobPostingJsonLd, jsonLdScript } from "@/lib/job-posting-jsonld";
import { formatPay, payBaseSalary } from "@/lib/pay";
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
    .select("*")
    .eq("public_token", token)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!posting || posting.status !== "open") notFound();
  // pay_* / tips added in 0015 — not in the generated row type yet.
  const pay = posting as typeof posting & {
    pay_min: number | null;
    pay_max: number | null;
    pay_period: "hour" | "year" | null;
    tips: boolean | null;
  };
  const payInfo = {
    min: pay.pay_min,
    max: pay.pay_max,
    period: (pay.pay_period ?? "hour") as "hour" | "year",
    tips: pay.tips ?? false,
  };
  const payLabel = formatPay(payInfo);

  // Resolve the job's location (the posting's, or the org's primary) for the
  // Google for Jobs structured data.
  const { data: locRows } = await supa
    .from("locations")
    .select("id, address_line1, address_line2, city, region, postal_code, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: true });
  const locations = (locRows ?? []) as Array<{
    id: string;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    region: string | null;
    postal_code: string | null;
  }>;
  const loc =
    locations.find((l) => l.id === posting.location_id) ?? locations[0] ?? null;

  const jsonLd = jobPostingJsonLd({
    jobTitle: posting.title,
    description: org.branding?.role_descriptions?.[posting.title] ?? null,
    datePosted: posting.created_at,
    orgName: org.name,
    orgLogo: org.branding?.logo_url ?? null,
    careersUrl: orgUrl(org.slug),
    jobUrl: orgUrl(org.slug, `/apply/${token}`),
    location: loc
      ? {
          streetAddress: [loc.address_line1, loc.address_line2].filter(Boolean).join(", ") || null,
          addressLocality: loc.city,
          addressRegion: loc.region,
          postalCode: loc.postal_code,
        }
      : null,
    baseSalary: payBaseSalary(payInfo),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <BrandTheme branding={org.branding} />
      <BrandHeader org={org} />
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
        {payLabel && (
          <div className="max-w-xl mx-auto mb-4">
            <span className="inline-block rounded-full bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)] font-semibold px-4 py-1.5 text-sm">
              {payLabel}
            </span>
          </div>
        )}
        <ApplicationForm
          token={token}
          postingTitle={posting.title}
          orgName={org.name}
          config={applicationConfig(org.branding, posting.title)}
          submitAction={submitApplication}
        />
      </main>
      <BrandFooter org={org} />
    </>
  );
}
