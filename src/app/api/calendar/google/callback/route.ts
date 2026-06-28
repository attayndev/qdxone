/**
 * Google OAuth callback — the single fixed redirect URI for the multi-tenant
 * Google app. Lands on the apex with no session, so trust comes entirely from
 * the signed `state` (org/user/subdomain binding + HMAC) plus the single-use
 * nonce cookie. Exchanges the code, stores the encrypted connection, and bounces
 * the operator back to their subdomain's Calendar settings.
 */

import { NextResponse, type NextRequest } from "next/server";
import { orgUrl } from "@/lib/tenancy";
import { apexUrl } from "@/lib/host";
import { decodeState } from "@/lib/scheduling/oauth-state";
import { exchangeGoogleCode } from "@/lib/calendar-providers/google";
import { saveConnection } from "@/lib/scheduling/connections";
import { NONCE_COOKIE } from "@/app/admin/scheduling/connect/google/route";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = decodeState(searchParams.get("state"));

  // Without a valid state we don't know the tenant — fail to the apex.
  if (!state) {
    return NextResponse.redirect(apexUrl("/admin?error=oauth_state_invalid"));
  }
  const back = (q: string) =>
    NextResponse.redirect(orgUrl(state.slug, `/admin/scheduling?${q}`));

  // Single-use nonce: the cookie set by the connect route must match the state.
  const nonce = request.cookies.get(NONCE_COOKIE)?.value;
  const clear = (res: NextResponse) => {
    res.cookies.set(NONCE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  };
  if (!nonce || nonce !== state.nonce) {
    return clear(back("error=oauth_nonce_mismatch"));
  }

  const oauthError = searchParams.get("error");
  if (oauthError) return clear(back(`error=${encodeURIComponent(oauthError)}`));

  const code = searchParams.get("code");
  if (!code) return clear(back("error=missing_code"));

  try {
    const tokens = await exchangeGoogleCode(code);
    await saveConnection({
      orgId: state.orgId,
      userId: state.userId,
      provider: "google",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      externalAccountId: tokens.email,
    });
    return clear(back("connected=google"));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[calendar/google/callback]", msg);
    return clear(back(`error=${encodeURIComponent("connect_failed")}`));
  }
}
