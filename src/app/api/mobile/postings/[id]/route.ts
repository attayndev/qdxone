/**
 * Mobile API: change a posting's status (PATCH — open/closed) or delete it
 * (DELETE). Authed by the app's Supabase JWT (Bearer); org resolved from token.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authedOrg } from "@/lib/mobile/auth";
import { setMobilePostingStatus, deleteMobilePosting } from "@/lib/mobile/postings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await authedOrg(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (body.status !== "open" && body.status !== "closed") {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const result = await setMobilePostingStatus(ctx.orgId, id, body.status);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await authedOrg(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await deleteMobilePosting(ctx.orgId, id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
