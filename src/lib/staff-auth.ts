import "server-only";
import { createClient as createServerSupa } from "./supabase/server";
import { adminClient } from "./supabase/admin";

/**
 * Employee-side access (the /staff area). The mirror of tenancy's
 * requireMembership, but for hourly employees rather than operators:
 * the authed Supabase user is an employee of this org only if their email
 * matches an employees.email in the org (the roster is the allowlist).
 * Employees see ONLY their own data — never anything admin.
 */

export interface StaffEmployee {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  user_id: string | null;
  invited_at: string | null;
  activated_at: string | null;
}

const COLS = "id, org_id, first_name, last_name, email, user_id, invited_at, activated_at";

/** Escape LIKE wildcards so an email is matched literally (case-insensitively). */
function likeLiteral(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * The employee record for the currently-authed user in this org, or null.
 * Matches by linked user_id first, else by email — linking user_id +
 * activated_at on first match so future lookups are by id.
 */
export async function currentEmployee(orgId: string): Promise<StaffEmployee | null> {
  const supa = await createServerSupa();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return null;
  const admin = adminClient();

  const { data: byId } = await admin
    .from("employees")
    .select(COLS)
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (byId) return byId as StaffEmployee;

  if (!user.email) return null;
  // Only an INVITED employee can activate by email (blocks un-invited emails and
  // is how "revoke" works: clearing invited_at + user_id locks them out). Matched
  // by email so it works across auth providers (password + Google/Apple), linking
  // user_id to whichever account authenticated.
  const { data: byEmail } = await admin
    .from("employees")
    .select(COLS)
    .eq("org_id", orgId)
    .ilike("email", likeLiteral(user.email))
    .not("invited_at", "is", null)
    .maybeSingle();
  const emp = byEmail as StaffEmployee | null;
  if (!emp) return null;

  if (emp.user_id !== user.id || !emp.activated_at) {
    const patch: Record<string, unknown> = { user_id: user.id };
    if (!emp.activated_at) patch.activated_at = new Date().toISOString();
    await admin.from("employees").update(patch as never).eq("id", emp.id);
    emp.user_id = user.id;
  }
  return emp;
}

/** For server actions: the employee, or throw (never leak admin data). */
export async function requireEmployee(orgId: string): Promise<StaffEmployee> {
  const emp = await currentEmployee(orgId);
  if (!emp) throw new Error("Not an employee of this organization");
  return emp;
}
