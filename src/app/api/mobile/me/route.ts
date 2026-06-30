/**
 * Mobile API: who am I? Returns the operator's org + role when the JWT belongs
 * to an org member, else 401. The app calls this right after an SSO sign-in to
 * confirm the account is actually an operator (and not just any Google/Apple
 * account) before showing the tabs. Authed by the Supabase JWT (Bearer).
 */

import { NextResponse, type NextRequest } from "next/server";
import { authedOrg } from "@/lib/mobile/auth";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ctx = await authedOrg(request);
  if (!ctx) return NextResponse.json({ error: "not_an_operator" }, { status: 401 });

  const { data: org } = await adminClient()
    .from("organizations")
    .select("name, slug")
    .eq("id", ctx.orgId)
    .maybeSingle();

  return NextResponse.json({
    userId: ctx.userId,
    orgId: ctx.orgId,
    role: ctx.role,
    org: org ?? null,
  });
}
