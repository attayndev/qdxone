/**
 * Host-aware sitemap. On an org subdomain (`<slug>.qdx.one`) it lists the org's
 * careers home + every OPEN posting's apply URL — the pages that carry Google
 * for Jobs structured data, so Google discovers them without crawling. On the
 * apex it lists the public marketing pages.
 */

import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { extractSlugFromHost } from "@/lib/tenancy";

export const runtime = "nodejs";
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

interface Entry {
  loc: string;
  lastmod?: string | null;
}

function xml(entries: Entry[]): NextResponse {
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        (e) =>
          `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod.slice(0, 10)}</lastmod>` : ""}</url>`
      )
      .join("\n") +
    `\n</urlset>\n`;
  return new NextResponse(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const slug = extractSlugFromHost(request.headers.get("host"));

  // Apex marketing site.
  if (!slug) {
    return xml(APEX_PATHS.map((p) => ({ loc: `${origin}${p}` })));
  }

  // Org subdomain: careers home + open postings.
  const supa = adminClient();
  const { data: org } = await supa
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) return xml([{ loc: `${origin}/` }]);

  const { data: postings } = await supa
    .from("job_postings")
    .select("public_token, updated_at")
    .eq("org_id", (org as { id: string }).id)
    .eq("status", "open");

  const entries: Entry[] = [{ loc: `${origin}/` }];
  for (const p of (postings as { public_token: string; updated_at: string }[] | null) ?? []) {
    entries.push({ loc: `${origin}/apply/${p.public_token}`, lastmod: p.updated_at });
  }
  return xml(entries);
}
