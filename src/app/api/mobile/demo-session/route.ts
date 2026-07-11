import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { DEMO_USER_EMAIL } from "@/lib/demo/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-tap demo login for the mobile app — mints a single-use magic-link token
 * for the shared demo user (a member of the demo org only) and returns its
 * hash. The app calls supabase.auth.verifyOtp({ token_hash, type: "magiclink" })
 * to establish a session and lands in the demo org's scrubbed data. Public by
 * design (same as the web "Enter demo"), so App Review / prospects can explore
 * without real employer credentials. The demo holds no real PII.
 */
export async function POST() {
  const { data, error } = await adminClient().auth.admin.generateLink({
    type: "magiclink",
    email: DEMO_USER_EMAIL,
  });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    return NextResponse.json({ error: "could not create demo session" }, { status: 500 });
  }
  return NextResponse.json({ token_hash: tokenHash });
}
