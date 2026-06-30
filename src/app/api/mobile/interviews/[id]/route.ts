/**
 * Mobile API: cancel an upcoming interview (DELETE). Frees the slot, deletes the
 * calendar event, and notifies the candidate — the web's cancelBooking, reused.
 * Authed by the app's Supabase JWT (Bearer); org resolved from the token.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authedOrg } from "@/lib/mobile/auth";
import { cancelMobileInterview } from "@/lib/mobile/interviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await authedOrg(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  let reason: string | undefined;
  try {
    const body = (await request.json()) as { reason?: string };
    reason = body.reason;
  } catch {
    // no body — cancel without a reason
  }

  const result = await cancelMobileInterview(ctx.orgId, id, reason);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
