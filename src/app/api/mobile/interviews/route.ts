/**
 * Mobile API: the operator's upcoming interviews (GET). Authed by the app's
 * Supabase JWT (Bearer); org resolved from the token.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authedOrg } from "@/lib/mobile/auth";
import { listMobileInterviews } from "@/lib/mobile/interviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ctx = await authedOrg(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const interviews = await listMobileInterviews(ctx.orgId);
  return NextResponse.json({ interviews });
}
