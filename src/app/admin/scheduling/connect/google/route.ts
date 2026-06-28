/**
 * Start the Google Calendar connect flow. Runs on the operator's subdomain
 * (authenticated). Binds the connect to this org+user with a signed `state`, and
 * sets a single-use nonce cookie scoped to `.qdx.one` so the apex callback can
 * verify it. Redirects to Google consent.
 */

import { NextResponse, type NextRequest } from "next/server";
import { currentOrgOrThrow, requireMembership, orgUrl } from "@/lib/tenancy";
import { googleOAuthConfigured } from "@/lib/calendar-providers/config";
import { buildGoogleAuthUrl } from "@/lib/calendar-providers/google";
import { encodeState, newNonce } from "@/lib/scheduling/oauth-state";
import { authCookieOverrides } from "@/lib/host";

export const runtime = "nodejs";

export const NONCE_COOKIE = "qdx_cal_oauth";

export async function GET(request: NextRequest) {
  const org = await currentOrgOrThrow();
  const back = (q: string) => NextResponse.redirect(orgUrl(org.slug, `/admin/scheduling?${q}`));

  if (!googleOAuthConfigured()) return back("error=not_configured");

  const m = await requireMembership(org.id);
  const nonce = newNonce();
  const state = encodeState({
    orgId: org.id,
    userId: m.user_id,
    slug: org.slug,
    provider: "google",
    nonce,
  });

  const res = NextResponse.redirect(buildGoogleAuthUrl(state));
  const { domain, secure } = authCookieOverrides(request.headers.get("host"));
  res.cookies.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax", // sent on the top-level redirect back from Google
    secure: secure !== false,
    domain, // `.qdx.one` so the apex callback can read it
    path: "/",
    maxAge: 600,
  });
  return res;
}
