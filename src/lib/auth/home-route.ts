import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/super/admin";
import { orgUrl } from "@/lib/tenancy";
import { apexUrl } from "@/lib/host";
import { DEMO_SLUG } from "@/lib/demo/seed";

/**
 * Where a signed-in user should land from the apex: their real org's admin, else
 * the platform console (staff), else the no-org login error. The shared `demo`
 * org is NEVER a home — a platform admin who was seeded into it still routes to
 * /super, not the demo dashboard.
 */
export async function resolveHomeUrl(user: {
  id: string;
  email?: string | null;
}): Promise<string> {
  const { data: memberships } = await adminClient()
    .from("org_members")
    .select("organizations:org_id ( slug )")
    .eq("user_id", user.id);
  type Memb = { organizations: { slug: string } | { slug: string }[] | null };
  const slugOf = (m: Memb) =>
    Array.isArray(m.organizations) ? m.organizations[0]?.slug : m.organizations?.slug;
  const realOrg = ((memberships ?? []) as Memb[])
    .map(slugOf)
    .find((s): s is string => !!s && s !== DEMO_SLUG);

  if (realOrg) return orgUrl(realOrg, "/admin");
  if (await isPlatformAdmin(user)) return apexUrl("/super");
  return apexUrl("/login?error=no_org");
}
