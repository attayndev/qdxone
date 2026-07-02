/**
 * Mobile API: one candidate's full report card (GET) + record a hiring decision
 * (PATCH). Authed by the app's Supabase JWT (Bearer); org + actor resolved from
 * the token. Native fetch isn't subject to CORS.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authedOrg } from "@/lib/mobile/auth";
import { getCandidateDetail, setMobileDecision } from "@/lib/mobile/candidate-detail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await authedOrg(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const detail = await getCandidateDetail(ctx.orgId, id, ctx.userId);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ candidate: detail });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await authedOrg(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { decision?: string | null; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const result = await setMobileDecision({
    orgId: ctx.orgId,
    userId: ctx.userId,
    applicationId: id,
    decision: body.decision ?? null,
    reason: body.reason ?? "",
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
