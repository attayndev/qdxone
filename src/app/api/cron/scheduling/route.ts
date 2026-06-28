/**
 * Outbox drain endpoint. Called by the Worker's scheduled() handler (Cloudflare
 * cron) — never by the public. Auth is a shared secret header (CRON_SECRET);
 * without a configured secret it refuses, so it can't be left open by accident.
 */

import { NextResponse, type NextRequest } from "next/server";
import { drainJobs } from "@/lib/scheduling/jobs";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "cron not configured" }, { status: 503 });
  }
  if (request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const summary = await drainJobs();
  return NextResponse.json({ ok: true, ...summary });
}
