/**
 * Host-aware robots.txt. Allows crawling of public + careers pages, points at
 * this host's sitemap, and keeps crawlers out of the admin app and private
 * token URLs (assessment / interview / status / auth). `/apply/` stays allowed —
 * those are the job pages we WANT in Google for Jobs.
 */

import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /a/",
    "Disallow: /interview/",
    "Disallow: /j/",
    "Disallow: /eeo/",
    "Disallow: /auth/",
    "Disallow: /api/",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
  return new NextResponse(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
