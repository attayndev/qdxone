/**
 * Mobile API: the operator's candidate list with computed fit. Authed by the
 * app's Supabase JWT (Bearer); org is resolved from the token, not the host, so
 * the apex URL works. Native fetch isn't subject to CORS.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authedOrg } from "@/lib/mobile/auth";
import { listScoredCandidates } from "@/lib/mobile/candidates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ctx = await authedOrg(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const candidates = await listScoredCandidates(ctx.orgId);
  return NextResponse.json({ candidates });
}
