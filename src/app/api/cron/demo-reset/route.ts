/**
 * Demo reset endpoint. Called by the Worker's scheduled() handler (Cloudflare
 * cron, nightly) — never by the public. Auth is the shared CRON_SECRET header,
 * same guard as /api/cron/scheduling; without a configured secret it refuses.
 * Rebuilds the demo org from source so every morning starts fresh.
 */

import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { resetDemoOrg } from "@/lib/demo/seed";
import { resetStaleAssessments } from "@/lib/assessment/reset-stale";

export const runtime = "nodejs";
export const maxDuration = 300;

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "cron not configured" }, { status: 503 });
  }
  if (!secretMatches(request.headers.get("x-cron-secret") ?? "", secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // Nightly tick: rebuild the demo org, then reset stale assessment sends
  // (all orgs) so anyone who didn't respond in 3 days is unblocked for a re-send.
  const { orgId, candidates } = await resetDemoOrg();
  const { reset } = await resetStaleAssessments();
  return NextResponse.json({ ok: true, orgId, candidates, assessmentsReset: reset });
}
