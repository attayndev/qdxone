/**
 * Postings data for the mobile app: the create-a-job screen (roles, stores,
 * existing postings with share links) plus create / status / delete. Reuses the
 * shared createJobPosting + parsePostingInput so pay-transparency validation and
 * the insert match the web exactly. Service-role, scoped to the org from the JWT.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { orgUrl } from "@/lib/tenancy";
import { getOrgLocations } from "@/lib/locations";
import { orgRoles } from "@/lib/roles";
import {
  parsePostingInput,
  createJobPosting,
  type RawPostingInput,
  type CreatePostingResult,
} from "@/lib/postings";

export interface MobilePostingView {
  id: string;
  title: string;
  status: "draft" | "open" | "closed";
  url: string;
  location: string | null;
  payMin: number | null;
  payMax: number | null;
  payPeriod: "hour" | "year";
  tips: boolean;
}

export interface PostingsScreen {
  roles: string[];
  locations: { id: string; name: string }[];
  hasLocation: boolean;
  careersUrl: string;
  postings: MobilePostingView[];
}

async function loadOrg(orgId: string) {
  const { data } = await adminClient()
    .from("organizations")
    .select("slug, branding")
    .eq("id", orgId)
    .maybeSingle();
  return (data as { slug: string; branding: unknown } | null) ?? null;
}

export async function getPostingsScreen(orgId: string): Promise<PostingsScreen | null> {
  const org = await loadOrg(orgId);
  if (!org) return null;

  const supa = adminClient();
  const [{ data: rows }, locations] = await Promise.all([
    supa
      .from("job_postings")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    getOrgLocations(orgId),
  ]);

  const locName = new Map(locations.map((l) => [l.id, l.name]));
  const multiLocation = locations.length > 1;

  type PostingRow = {
    id: string;
    title: string;
    status: "draft" | "open" | "closed";
    public_token: string;
    location_id: string | null;
    pay_min: number | null;
    pay_max: number | null;
    pay_period: "hour" | "year" | null;
    tips: boolean | null;
  };

  const postings: MobilePostingView[] = ((rows as PostingRow[] | null) ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    url: orgUrl(org.slug, `/j/${p.public_token}`),
    location: multiLocation && p.location_id ? locName.get(p.location_id) ?? null : null,
    payMin: p.pay_min,
    payMax: p.pay_max,
    payPeriod: p.pay_period ?? "hour",
    tips: p.tips ?? false,
  }));

  return {
    roles: orgRoles(org.branding as Parameters<typeof orgRoles>[0]),
    locations: locations.map((l) => ({ id: l.id, name: l.name })),
    hasLocation: locations.length > 0,
    careersUrl: orgUrl(org.slug),
    postings,
  };
}

export async function createMobilePosting(
  orgId: string,
  userId: string,
  raw: RawPostingInput
): Promise<CreatePostingResult> {
  const parsed = parsePostingInput(raw);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return createJobPosting(orgId, userId, parsed.data);
}

export async function setMobilePostingStatus(
  orgId: string,
  id: string,
  status: "open" | "closed"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await adminClient()
    .from("job_postings")
    .update({ status })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Delete a posting. Applications snapshot title/store/answers at submit time, so
 * we sever the nullable back-link first (avoids an FK restriction) then delete —
 * candidate records are untouched. Mirrors the web's deletePosting.
 */
export async function deleteMobilePosting(
  orgId: string,
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supa = adminClient();
  await supa
    .from("applications")
    .update({ job_posting_id: null })
    .eq("job_posting_id", id)
    .eq("org_id", orgId);
  const { error } = await supa.from("job_postings").delete().eq("id", id).eq("org_id", orgId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
