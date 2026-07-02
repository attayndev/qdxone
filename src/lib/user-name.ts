/**
 * Operator display names. First/last name live on the auth user's
 * `user_metadata` (person-level, tied to their email — not per-org). Use these
 * helpers everywhere we'd otherwise show a bare email. Pure/client-safe.
 */

export interface NamedUser {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

/** "First Last" from user_metadata, or null if neither is set. */
export function userFullName(u: NamedUser | null | undefined): string | null {
  const m = (u?.user_metadata ?? {}) as { first_name?: unknown; last_name?: unknown };
  const first = typeof m.first_name === "string" ? m.first_name.trim() : "";
  const last = typeof m.last_name === "string" ? m.last_name.trim() : "";
  const full = [first, last].filter(Boolean).join(" ");
  return full || null;
}

/** Name if set, else the email, else a placeholder. */
export function userDisplay(u: NamedUser | null | undefined): string {
  return userFullName(u) ?? u?.email ?? "(unknown)";
}
