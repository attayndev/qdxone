import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { extractSlugFromHost, orgUrl } from "@/lib/tenancy";
import { apexUrl } from "@/lib/host";

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
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";
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
    const { data: existingOwner } = await admin
      .from("org_members")
      .select("user_id")
      .eq("org_id", signupOrgId)
      .eq("role", "owner")
      .maybeSingle();
    if (!existingOwner) {
      await admin
        .from("org_members")
        .upsert({ org_id: signupOrgId, user_id: userId, role: "owner" });
      await admin.from("audit_events").insert({
        org_id: signupOrgId,
        kind: "org.owner_added",
        meta: { user_id: userId, email: user.email },
      });
    }
  }

  // On a subdomain callback, just go to `next`.
  if (slug) return NextResponse.redirect(orgUrl(slug, next));

  // On the apex, resolve the user's primary org → its subdomain admin.
  const admin = adminClient();
  const { data: memberships } = await admin
    .from("org_members")
    .select("org_id, organizations:org_id ( slug )")
    .eq("user_id", userId);
  type Memb = {
    org_id: string;
    organizations: { slug: string } | { slug: string }[] | null;
  };
  const list = (memberships ?? []) as Memb[];
  const first = list[0];
  const slugFromMembership = first
    ? Array.isArray(first.organizations)
      ? first.organizations[0]?.slug
      : first.organizations?.slug
    : null;

  if (!slugFromMembership) {
    return NextResponse.redirect(apexUrl("/login?error=no_org"));
  }
  return NextResponse.redirect(orgUrl(slugFromMembership, "/admin"));
}
