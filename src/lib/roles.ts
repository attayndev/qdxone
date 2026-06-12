import type { OrgBranding } from "./supabase/types";

/**
 * Starting-template roles for a new QSR operator. Operators edit their own
 * list in setup; postings pick from it, and the chosen role is recorded on
 * each application so scoring/benchmarks can later be computed per role.
 */
export const DEFAULT_ROLES = [
  "Team Member",
  "Shift Lead",
  "Assistant Manager",
  "Manager",
];

/** The org's role list, falling back to the default template. */
export function orgRoles(branding: OrgBranding | null | undefined): string[] {
  const r = branding?.roles;
  return Array.isArray(r) && r.length > 0 ? r : DEFAULT_ROLES;
}

/** Whether the operator has explicitly defined their own roles. */
export function hasCustomRoles(branding: OrgBranding | null | undefined): boolean {
  return Array.isArray(branding?.roles) && branding!.roles!.length > 0;
}

export type RoleDetail = { name: string; description: string };

/** Roles paired with their job descriptions (empty string if none). */
export function orgRolesDetailed(
  branding: OrgBranding | null | undefined
): RoleDetail[] {
  const descs = branding?.role_descriptions ?? {};
  return orgRoles(branding).map((name) => ({
    name,
    description: descs[name] ?? "",
  }));
}

/** Job description for a specific role name, if set. */
export function roleDescription(
  branding: OrgBranding | null | undefined,
  roleName: string
): string | null {
  return branding?.role_descriptions?.[roleName] ?? null;
}
