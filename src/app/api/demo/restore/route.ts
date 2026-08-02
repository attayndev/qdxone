/**
 * Restore the demo to its canonical state on demand (the demo-bar "Restore"
 * button). Reloads the FROZEN anonymized snapshot — same data as the nightly
 * reset — without re-capturing from live. Scoped to the demo subdomain (the
 * Worker injects x-org-slug) and throttled so repeat clicks can't hammer it.
 */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { adminClient } from "@/lib/supabase/admin";
import { resetDemoOrg, DEMO_SLUG } from "@/lib/demo/seed";

export const runtime = "nodejs";
export const maxDuration = 300;

const THROTTLE_MS = 30_000;

export async function POST() {
  const slug = (await headers()).get("x-org-slug");
  if (slug !== DEMO_SLUG) {
    return NextResponse.json({ error: "Restore is only available in the demo." }, { status: 403 });
  }

  // Throttle: if the demo was rebuilt in the last 30s, treat as a no-op success.
  const supa = adminClient();
  const { data: org } = await supa
    .from("organizations")
    .select("id")
    .eq("slug", DEMO_SLUG)
    .maybeSingle();
  const orgId = (org as { id: string } | null)?.id;
  if (orgId) {
    const { data: newest } = await supa
      .from("applications")
      .select("created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const ts = (newest as { created_at: string } | null)?.created_at;
    if (ts && Date.now() - new Date(ts).getTime() < THROTTLE_MS) {
      return NextResponse.json({ ok: true, throttled: true });
    }
  }

  const { candidates } = await resetDemoOrg();
  return NextResponse.json({ ok: true, candidates });
}
