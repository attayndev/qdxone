/**
 * Gate for the platform super-admin console. Two hard rules:
 *   1. Apex only — never reachable from a tenant subdomain.
 *   2. The signed-in user's email is in PLATFORM_OWNER_EMAILS (comma-sep).
 * Any failure 404s (we don't reveal the surface exists). Returns the staff user.
 */

import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractSlugFromHost } from "@/lib/tenancy";

export async function requirePlatformOwner(): Promise<{ id: string; email: string }> {
  const h = await headers();
  if (extractSlugFromHost(h.get("host"))) notFound(); // tenant subdomain → hide it

  const allowed = (process.env.PLATFORM_OWNER_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const supa = await createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  const email = (user?.email ?? "").toLowerCase();
  if (!user || !allowed.includes(email)) notFound();
  return { id: user.id, email };
}
