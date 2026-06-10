import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { extractSlugFromHost, orgUrl } from "@/lib/tenancy";

/**
 * Supabase magic-link callback.
 *
 *  - Exchange the code for a session.
 *  - If a `signup=<orgId>` query param is present, add this user as
 *    the org's owner (signup completion).
 *  - On the apex domain (no slug), look up the user's first org and
 *    redirect to that subdomain's /admin.
 *  - On a subdomain, just send them to `next` (default /admin).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  const host = request.headers.get("host");
  const slug = extractSlugFromHost(host);

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=callback_failed`);
  }

  const supa = await createClient();
  const { data, error } = await supa.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=callback_failed`);
  }
  const userId = data.user.id;

  // Signup completion: promote this user to owner of the org they created.
  // SECURITY: the target org comes from the user's OWN auth metadata (set
  // server-side during signup via signInWithOtp `data`), never from a URL
  // param — otherwise anyone could append ?signup=<any-org-id> to their
  // magic link and seize another org. We also refuse if the org already
  // has an owner, so the claim only succeeds for a freshly created org.
  const signupOrgId =
    typeof data.user.user_metadata?.signup_org_id === "string"
      ? data.user.user_metadata.signup_org_id
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
        meta: { user_id: userId, email: data.user.email },
      });
    }
  }

  // On a subdomain, just go to the requested next.
  if (slug) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // On the apex, find the user's primary org and redirect to its
  // subdomain admin.
  const admin = adminClient();
  const { data: memberships } = await admin
    .from("org_members")
    .select("org_id, role, organizations:org_id ( slug )")
    .eq("user_id", userId);

  type Memb = {
    org_id: string;
    role: string;
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
    return NextResponse.redirect(`${origin}/login?error=no_org`);
  }
  return NextResponse.redirect(orgUrl(slugFromMembership, "/admin"));
}
