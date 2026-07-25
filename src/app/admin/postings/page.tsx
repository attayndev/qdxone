import { notFound } from "next/navigation";
import Link from "next/link";
import { currentOrg, orgUrl } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import { getOrgLocations } from "@/lib/locations";
import { orgRoles } from "@/lib/roles";
import { qrSvg } from "@/lib/qr";
import PostingsClient, {
  type PostingView,
} from "@/components/admin/PostingsClient";
import type { Database } from "@/lib/supabase/database.types";
import type { FieldMode } from "@/lib/supabase/types";

type PostingRow = Database["public"]["Tables"]["job_postings"]["Row"];

export default async function PostingsPage() {
  const org = await currentOrg();
  if (!org) notFound();

  const supa = adminClient();
  const [{ data: rows }, locations] = await Promise.all([
    supa
      .from("job_postings")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false }),
    getOrgLocations(org.id),
  ]);
  const locName = new Map(locations.map((l) => [l.id, l.name]));
  const multiLocation = locations.length > 1;

  // The org-level careers page: one link + QR covering every open role.
  const careersUrl = orgUrl(org.slug);
  const careersQr = await qrSvg(careersUrl);

  const postings: PostingView[] = await Promise.all(
    ((rows as PostingRow[] | null) ?? []).map(async (p) => {
      const url = orgUrl(org.slug, `/j/${p.public_token}`);
      // pay_* / tips added in 0015, field modes in 0022 — not in generated types yet.
      const pay = p as typeof p & {
        pay_min: number | null;
        pay_max: number | null;
        pay_period: "hour" | "year" | null;
        tips: boolean | null;
        work_experience_mode: FieldMode | null;
        references_mode: FieldMode | null;
      };
      return {
        id: p.id,
        title: p.title,
        status: p.status,
        url,
        qrSvg: await qrSvg(url),
        locationId: p.location_id,
        location: multiLocation
          ? (p.location_id ? locName.get(p.location_id) ?? null : null)
          : null,
        payMin: pay.pay_min,
        payMax: pay.pay_max,
        payPeriod: pay.pay_period ?? "hour",
        tips: pay.tips ?? false,
        workExperienceMode: pay.work_experience_mode,
        referencesMode: pay.references_mode,
      };
    })
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Job postings</h1>
          <p className="text-[color:var(--brand-ink-muted)]">
            Shareable links + QR codes for in-store flyers. Candidates apply
            straight from their phone.
          </p>
        </div>
        {locations.length === 0 && (
          <Link href="/admin/locations" className="btn-primary">
            Set up store profile
          </Link>
        )}
      </div>

      <Link
        href="/admin/locations#questions"
        className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-[color:var(--brand-line)] bg-[color:var(--brand-soft)] px-4 py-3 hover:border-[color:var(--brand-blue)]"
      >
        <span className="text-sm">
          <span className="font-semibold">Want to ask applicants your own questions?</span>{" "}
          <span className="text-[color:var(--brand-ink-muted)]">
            Add custom questions (availability, certifications, anything) — they show on every job&apos;s application.
          </span>
        </span>
        <span className="font-semibold text-[color:var(--brand-blue-600)] whitespace-nowrap">Set up →</span>
      </Link>

      <PostingsClient
        postings={postings}
        hasLocation={locations.length > 0}
        roles={orgRoles(org.branding)}
        locations={locations.map((l) => ({ id: l.id, name: l.name }))}
        careers={{ url: careersUrl, qrSvg: careersQr }}
        orgName={org.name}
      />
    </div>
  );
}
