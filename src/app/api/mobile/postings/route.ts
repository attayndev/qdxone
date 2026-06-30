/**
 * Mobile API: the operator's postings screen (GET — roles, stores, existing
 * postings with share links) and create a posting (POST). Authed by the app's
 * Supabase JWT (Bearer); org + actor resolved from the token.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authedOrg } from "@/lib/mobile/auth";
import { getPostingsScreen, createMobilePosting } from "@/lib/mobile/postings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ctx = await authedOrg(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const screen = await getPostingsScreen(ctx.orgId);
  if (!screen) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(screen);
}

export async function POST(request: NextRequest) {
  const ctx = await authedOrg(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const result = await createMobilePosting(ctx.orgId, ctx.userId, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
