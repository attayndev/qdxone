/**
 * Host-aware sitemap (Next metadata convention → /sitemap.xml). On an org
 * subdomain it lists the careers home + every OPEN posting's apply URL (the
 * pages that carry Google for Jobs JSON-LD); on the apex it lists the public
 * marketing pages. `headers()` gives us the request host, which makes it dynamic.
 *
 * (robots.txt is managed at the Cloudflare edge — it allows search crawlers and
 * blocks AI-training bots — so there's no app/robots here; submit this sitemap
 * directly in Google Search Console.)
 */

import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { adminClient } from "@/lib/supabase/admin";
import { extractSlugFromHost } from "@/lib/tenancy";

export const dynamic = "force-dynamic";

const APEX_PATHS = [
  "/",
  "/how-it-works",
  "/assessments",
  "/pricing",
  "/faq",
  "/for-qsr",
  "/for-independents",
  "/enterprise",
  "/about",
  "/terms",
  "/privacy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("host") ?? "qdx.one";
  const httpDev = host.includes("localhost") || host.includes("lvh.me");
  const origin = `${httpDev ? "http" : "https"}://${host}`;
  const slug = extractSlugFromHost(host);

  // Apex marketing site.
  if (!slug) {
    return APEX_PATHS.map((p) => ({ url: `${origin}${p}` }));
  }

  // Org subdomain: careers home + open postings.
  const supa = adminClient();
  const { data: org } = await supa
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) return [{ url: `${origin}/` }];

  const { data: postings } = await supa
    .from("job_postings")
    .select("public_token, updated_at")
    .eq("org_id", (org as { id: string }).id)
    .eq("status", "open");

  return [
    { url: `${origin}/` },
    ...((postings as { public_token: string; updated_at: string }[] | null) ?? []).map((p) => ({
      url: `${origin}/apply/${p.public_token}`,
      lastModified: new Date(p.updated_at),
    })),
  ];
}
