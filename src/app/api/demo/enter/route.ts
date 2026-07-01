/**
 * "Enter the demo": one click → a signed-in session as the shared demo user
 * (a member of the demo org only), dropped into the requested admin section. No
 * credentials — the demo holds only scrubbed fake data. We mint a single-use
 * magic-link token server-side, verify it here to establish the session, then
 * redirect straight to the destination (doing it inline avoids the /auth/callback
 * `next` round-trip, which was dropping the section).
 */

import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { orgUrl } from "@/lib/tenancy";
import { DEMO_SLUG, DEMO_USER_EMAIL } from "@/lib/demo/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to") ?? "/admin";
  const dest = to.startsWith("/admin") ? to : "/admin"; // only admin destinations

  const { data, error } = await adminClient().auth.admin.generateLink({
    type: "magiclink",
    email: DEMO_USER_EMAIL,
  });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) return NextResponse.redirect(orgUrl(DEMO_SLUG));

  // Verify here so the session cookie is set on this response, then go straight
  // to the section — no dependence on the callback preserving `next`.
  const supa = await createClient();
  const { error: vErr } = await supa.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (vErr) return NextResponse.redirect(orgUrl(DEMO_SLUG));

  return NextResponse.redirect(orgUrl(DEMO_SLUG, dest));
}
