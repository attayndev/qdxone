import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { currentOrg } from "@/lib/tenancy";
import { sendStaffSetupLink } from "@/lib/staff-invite";

export const runtime = "nodejs";

/**
 * Employee (/staff) auth — email + password, à la ~/projects/literal, no 2FA.
 *   - `password`     — sign in with email + password (sets the session cookie).
 *   - `reset`        — email an on-roster employee a set-password link. Always
 *                      returns the same shape (never reveals membership).
 *   - `set-password` — set the password for the current (magic-link) session.
 * Access to /staff itself is gated separately by requireEmployee.
 */
function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req: NextRequest) {
  let body: { action?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const supa = await createClient();

  // Set the password for the current session (reached via the emailed link).
  if (body.action === "set-password") {
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    const { error } = await supa.auth.updateUser({ password });
    if (error) {
      return NextResponse.json(
        { error: "Could not set password. Your link may have expired — request a new one." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (body.action === "password") {
    const password = typeof body.password === "string" ? body.password : "";
    if (!password) return NextResponse.json({ error: "Password is required." }, { status: 400 });
    const { error } = await supa.auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reset") {
    const org = await currentOrg();
    if (org) {
      // Opaque either way — don't reveal whether the email is on the roster.
      await sendStaffSetupLink({ orgId: org.id, orgSlug: org.slug, orgName: org.name, email });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
