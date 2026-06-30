/**
 * Auth for the mobile API. The operator app sends its Supabase session JWT as a
 * Bearer token; we verify it, then resolve the user's org (operators are
 * single-org in the beta). Routes use adminClient after this membership check —
 * the same trust model as the web's requireMembership + server actions.
 */

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase/admin";

export interface MobileCtx {
  userId: string;
  orgId: string;
  role: string;
}

export async function authedOrg(request: Request): Promise<MobileCtx | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  // Validate the JWT and get the user.
  const verifier = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await verifier.auth.getUser(token);
  if (error || !data.user) return null;

  // Resolve org membership (service role; beta operators belong to one org).
  const { data: mem } = await adminClient()
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", data.user.id)
    .limit(1)
    .maybeSingle();
  if (!mem) return null;
  const m = mem as { org_id: string; role: string };
  return { userId: data.user.id, orgId: m.org_id, role: m.role };
}
