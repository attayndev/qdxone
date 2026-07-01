/**
 * "Enter the demo": one click on the demo landing → a signed-in session as the
 * demo user (a member of the demo org only), dropped into the requested admin
 * section. No credentials needed — that's the point; the demo holds only
 * scrubbed fake data. We mint a single-use magic-link token server-side and hand
 * it to the standard /auth/callback, so it reuses the proven session path.
 */

import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { orgUrl } from "@/lib/tenancy";
import { DEMO_SLUG, DEMO_USER_EMAIL } from "@/lib/demo/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to") ?? "/admin";
  const next = to.startsWith("/admin") ? to : "/admin"; // only admin destinations

  const admin = adminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: DEMO_USER_EMAIL,
  });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    return NextResponse.redirect(orgUrl(DEMO_SLUG)); // fall back to the landing
  }

  const callback = orgUrl(
    DEMO_SLUG,
    `/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink&next=${encodeURIComponent(next)}`
  );
  return NextResponse.redirect(callback);
}
