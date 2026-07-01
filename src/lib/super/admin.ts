/**
 * Platform-admin membership. The `platform_admins` table (migration 0017) is the
 * source of truth; the PLATFORM_OWNER_EMAILS env string is kept only as a
 * bootstrap fallback so we're never locked out before the table is seeded. On a
 * match by email we self-heal the row's `user_id` for future exact-id checks.
 */

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase/admin";

// platform_admins isn't in the generated types until regenerated post-0017.
function db(): SupabaseClient {
  return adminClient() as unknown as SupabaseClient;
}

function envAllows(email: string): boolean {
  if (!email) return false;
  return (process.env.PLATFORM_OWNER_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email);
}

export async function isPlatformAdmin(user: { id: string; email?: string | null }): Promise<boolean> {
  const email = (user.email ?? "").toLowerCase();

  const { data, error } = await db().from("platform_admins").select("id, user_id, email");
  if (!error && data) {
    const rows = data as { id: string; user_id: string | null; email: string }[];
    const match = rows.find((r) => r.user_id === user.id || r.email.toLowerCase() === email);
    if (match) {
      if (!match.user_id) {
        await db().from("platform_admins").update({ user_id: user.id }).eq("id", match.id);
      }
      return true;
    }
  }

  // Bootstrap fallback (table missing/empty, or not yet seeded).
  return envAllows(email);
}
