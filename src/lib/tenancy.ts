import { headers } from "next/headers";
import { adminClient } from "./supabase/admin";
import { createClient as createServerSupa } from "./supabase/server";
import type { OrganizationRow } from "./supabase/types";

export const ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "qdx.one";

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "marketing",
  "auth",
  "billing",
  "stripe",
  "static",
  "assets",
  "mail",
  "docs",
  "status",
  "blog",
]);

export function isReservedSubdomain(s: string): boolean {
  return RESERVED_SUBDOMAINS.has(s.toLowerCase());
}

/**
 * Pull the org slug from the Host header (set by `proxy.ts`).
 * Returns null on the apex (`qdx.one` / `www.qdx.one` / localhost).
 */
export function extractSlugFromHost(host: string | null): string | null {
  if (!host) return null;
  const cleaned = host.split(":")[0].toLowerCase();
  // localhost dev: support `<slug>.localhost` and `<slug>.lvh.me`
  if (cleaned === "localhost" || cleaned === "127.0.0.1") return null;
  if (cleaned.endsWith(".localhost") || cleaned.endsWith(".lvh.me")) {
    const sub = cleaned.replace(/\.(localhost|lvh\.me)$/, "");
    return isReservedSubdomain(sub) ? null : sub;
  }
  // apex
  if (cleaned === ROOT_DOMAIN || cleaned === `www.${ROOT_DOMAIN}`) return null;
  if (!cleaned.endsWith(`.${ROOT_DOMAIN}`)) return null;
  const sub = cleaned.slice(0, -1 - ROOT_DOMAIN.length);
  if (!sub || sub.includes(".")) return null; // sub-subdomains aren't org slugs
  return isReservedSubdomain(sub) ? null : sub;
}

/**
 * Resolve the organization for the current request.
 * Reads the slug from the `x-org-slug` header set by `proxy.ts`.
 * Returns null on the apex domain.
 */
export async function currentOrg(): Promise<OrganizationRow | null> {
  const h = await headers();
  const slug = h.get("x-org-slug");
  if (!slug) return null;
  const supa = adminClient();
  const { data } = await supa
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as OrganizationRow | null) ?? null;
}

export async function currentOrgOrThrow(): Promise<OrganizationRow> {
  const org = await currentOrg();
  if (!org) throw new Error("No organization in context");
  return org;
}

/**
 * Confirm the signed-in user is a member of the given org.
 * Returns role on success, null otherwise.
 */
export async function getMembership(
  orgId: string
): Promise<{ user_id: string; role: "owner" | "admin" } | null> {
  const supa = await createServerSupa();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return null;
  const { data } = await supa
    .from("org_members")
    .select("user_id, role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  return (data as { user_id: string; role: "owner" | "admin" } | null) ?? null;
}

export async function requireMembership(orgId: string) {
  const m = await getMembership(orgId);
  if (!m) throw new Error("Not a member of this organization");
  return m;
}

/**
 * Build the URL for an org's subdomain. Prefers https in production.
 */
export function orgUrl(slug: string, path = ""): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? `https://${slug}.${ROOT_DOMAIN}`;
  if (base.includes("localhost") || base.startsWith("http://")) {
    // dev: use slug.localhost:PORT
    try {
      const u = new URL(base);
      u.hostname = `${slug}.localhost`;
      return `${u.toString().replace(/\/$/, "")}${path}`;
    } catch {
      // fall through
    }
  }
  return `https://${slug}.${ROOT_DOMAIN}${path}`;
}
