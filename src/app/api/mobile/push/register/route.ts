/**
 * Mobile API: register this device's Expo push token (POST). Called on launch
 * once the operator grants notification permission. Authed by the app's
 * Supabase JWT (Bearer); org + user resolved from the token.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authedOrg } from "@/lib/mobile/auth";
import { registerPushToken, type DevicePlatform } from "@/lib/mobile/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ctx = await authedOrg(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { token?: string; platform?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }
  const platform: DevicePlatform =
    body.platform === "ios" || body.platform === "android" ? body.platform : "unknown";

  const result = await registerPushToken({
    orgId: ctx.orgId,
    userId: ctx.userId,
    token: body.token,
    platform,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
