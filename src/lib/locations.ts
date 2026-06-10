import { adminClient } from "./supabase/admin";
import type { Database } from "./supabase/database.types";

export type LocationRow = Database["public"]["Tables"]["locations"]["Row"];

/** All locations for an org, oldest first. */
export async function getOrgLocations(orgId: string): Promise<LocationRow[]> {
  const supa = adminClient();
  const { data } = await supa
    .from("locations")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });
  return (data as LocationRow[] | null) ?? [];
}

/**
 * The org's primary (single) location. MVP is single-location, so this is
 * the location postings hang off of. Returns null until one is created.
 */
export async function getPrimaryLocation(
  orgId: string
): Promise<LocationRow | null> {
  const locs = await getOrgLocations(orgId);
  return locs[0] ?? null;
}
