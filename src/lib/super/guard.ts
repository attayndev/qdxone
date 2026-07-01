/**
 * Gate for the platform super-admin console.
 *   - Apex only — never reachable from a tenant subdomain (404 there).
 *   - Admin = a platform_admins row (or the PLATFORM_OWNER_EMAILS bootstrap
 *     fallback); see ./admin.
 *
 * `platformContext()` never throws for a non-admin — the /super page renders its
 * own login screen instead. `requirePlatformOwner()` (for sub-pages) bounces a
 * non-admin back to that login.
 */

import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractSlugFromHost } from "@/lib/tenancy";
import { isPlatformAdmin } from "./admin";

export interface PlatformContext {
  user: { id: string; email: string | null } | null;
  isAdmin: boolean;
}

export async function platformContext(): Promise<PlatformContext> {
  const h = await headers();
  if (extractSlugFromHost(h.get("host"))) notFound(); // apex only; hide on subdomains

  const supa = await createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { user: null, isAdmin: false };

  const isAdmin = await isPlatformAdmin({ id: user.id, email: user.email });
  return { user: { id: user.id, email: user.email ?? null }, isAdmin };
}

export async function requirePlatformOwner(): Promise<{ id: string; email: string }> {
  const { user, isAdmin } = await platformContext();
  if (!user || !isAdmin) redirect("/super");
  return { id: user.id, email: (user.email ?? "").toLowerCase() };
}
