import { notFound } from "next/navigation";
import Link from "next/link";
import { currentOrg, orgUrl } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import { getPrimaryLocation } from "@/lib/locations";
import { qrSvg } from "@/lib/qr";
import PostingsClient, {
  type PostingView,
} from "@/components/admin/PostingsClient";
import type { Database } from "@/lib/supabase/database.types";

type PostingRow = Database["public"]["Tables"]["job_postings"]["Row"];

export default async function PostingsPage() {
  const org = await currentOrg();
  if (!org) notFound();

  const supa = adminClient();
  const [{ data: rows }, location] = await Promise.all([
    supa
      .from("job_postings")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false }),
    getPrimaryLocation(org.id),
  ]);

  const postings: PostingView[] = await Promise.all(
    ((rows as PostingRow[] | null) ?? []).map(async (p) => {
      const url = orgUrl(org.slug, `/j/${p.public_token}`);
      return {
        id: p.id,
        title: p.title,
        role_type: p.role_type,
        status: p.status,
        url,
        qrSvg: await qrSvg(url),
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
        {!location && (
          <Link href="/admin/locations" className="btn-primary">
            Set up store profile
          </Link>
        )}
      </div>

      <PostingsClient postings={postings} hasLocation={!!location} />
    </div>
  );
}
