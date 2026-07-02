import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { extractSlugFromHost, orgUrl } from "@/lib/tenancy";
import { apexUrl } from "@/lib/host";
import { isPlatformAdmin } from "@/lib/super/admin";

/**
 * Auth callback. Primary path is the `token_hash` OTP flow (verifyOtp) — it
 * needs no PKCE code verifier, so it works over plain http and across hosts.
 * Falls back to the PKCE `code` exchange if a link still carries `?code=`.
 *
 *  - Verify the link → establish the session (cookie scoped to `.qdx.one`).
 *  - If the user has `signup_org_id` in their auth metadata, promote them to
 *    owner of that org (first-owner only — never from a URL param).
 *  - On the apex, resolve the user's org and redirect to its subdomain admin.
 */
export async function GET(request: NextRequest) {
  try {
    return await handleCallback(request);
  } catch (e) {
    // Surface the real error in the URL instead of an opaque 500.
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[auth/callback] unhandled exception:", e);
    return NextResponse.redirect(
      apexUrl(`/login?error=callback_exception&reason=${encodeURIComponent(msg)}`)
    );
  }
}

async function handleCallback(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  // Only accept same-site relative paths — reject "//evil.com", "/\evil.com",
  // and "/@evil.com" (which orgUrl would turn into an off-site redirect).
  const nextParam = searchParams.get("next") ?? "/admin";
  const next = /^\/[^/\\@]/.test(nextParam) ? nextParam : "/admin";
  const slug = extractSlugFromHost(request.headers.get("host"));
  // Surface the reason in the URL so it's visible without the terminal.
  const fail = (reason: string) => {
    console.error("[auth/callback]", reason);
    return NextResponse.redirect(
      apexUrl(`/login?error=callback_failed&reason=${encodeURIComponent(reason)}`)
    );
  };

  const supa = await createClient();
  let user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null =
    null;

  if (tokenHash && type) {
    const { data, error } = await supa.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error || !data.user) {
      return fail(`verifyOtp(${type}): ${error?.message ?? "no user"}`);
    }
    user = data.user;
  } else if (code) {
    const { data, error } = await supa.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      return fail(`exchangeCodeForSession: ${error?.message ?? "no user"}`);
    }
    user = data.user;
  } else {
    return fail("no token_hash or code in callback URL");
  }

  const userId = user.id;

  // Signup completion: promote to owner of the org from the user's OWN auth
  // metadata (set server-side at signup), only if the org has no owner yet.
  const signupOrgId =
    typeof user.user_metadata?.signup_org_id === "string"
      ? user.user_metadata.signup_org_id
      : null;
  if (signupOrgId) {
    const admin = adminClient();
    const { data: orgRow } = await admin
      .from("organizations")
      .select("pending_owner_email")
      .eq("id", signupOrgId)
      .maybeSingle();
    const pending = (orgRow as { pending_owner_email: string | null } | null)?.pending_owner_email;
    // Promote to owner only if THIS verified email is the one that signed the org
    // up — not just whatever org id the (client-writable) metadata points at.
    const emailMatches =
      !!pending && !!user.email && pending.toLowerCase() === user.email.toLowerCase();
    const { data: existingOwner } = await admin
      .from("org_members")
      .select("user_id")
      .eq("org_id", signupOrgId)
      .eq("role", "owner")
      .maybeSingle();
    if (!existingOwner && emailMatches) {
      await admin
        .from("org_members")
        .upsert({ org_id: signupOrgId, user_id: userId, role: "owner" });
      // One-time: clear it so the slot can't be re-claimed later.
      await admin
        .from("organizations")
        .update({ pending_owner_email: null })
        .eq("id", signupOrgId);
      await admin.from("audit_events").insert({
        org_id: signupOrgId,
        kind: "org.owner_added",
        meta: { user_id: userId, email: user.email },
      });
    }
  }

  // On a subdomain callback, just go to `next`.
  if (slug) return NextResponse.redirect(orgUrl(slug, next));

  // Platform-admin sign-in: an explicit /super intent wins over org routing, so
  // an admin who also owns an org still lands on the console.
  if (next.startsWith("/super") && (await isPlatformAdmin(user))) {
    return NextResponse.redirect(apexUrl("/super"));
  }

  // On the apex, route the user to their home (real org admin / staff console /
  // no-org error) — the shared demo org is never treated as a home.
  const { resolveHomeUrl } = await import("@/lib/auth/home-route");
  return NextResponse.redirect(await resolveHomeUrl(user));
}
