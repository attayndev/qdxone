/**
 * Mobile API: mint an interview booking link for a candidate (POST), optionally
 * emailing it from the store. Authed by the app's Supabase JWT (Bearer); org +
 * actor resolved from the token.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authedOrg } from "@/lib/mobile/auth";
import { createMobileInvite } from "@/lib/mobile/interviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await authedOrg(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { templateId?: string; email?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.templateId) {
    return NextResponse.json({ error: "Pick an interview type." }, { status: 400 });
  }

  const result = await createMobileInvite({
    orgId: ctx.orgId,
    userId: ctx.userId,
    applicationId: id,
    templateId: body.templateId,
    email: body.email === true,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ url: result.url, sentTo: result.sentTo });
}
