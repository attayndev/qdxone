"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformOwner } from "@/lib/super/guard";
import { adminClient } from "@/lib/supabase/admin";
import { resetDemoOrg, DEMO_SLUG } from "@/lib/demo/seed";

/** Rebuild the demo org from the live 16 Handles data (PII scrubbed). Staff only. */
export async function seedDemo(): Promise<
  { ok: true; candidates: number } | { ok: false; error: string }
> {
  await requirePlatformOwner();
  try {
    const { candidates } = await resetDemoOrg();
    return { ok: true, candidates };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Seed failed." };
  }
}

/** Suspend / unsuspend an org (blocks its admin until restored). Staff only. */
export async function setOrgSuspended(
  orgId: string,
  suspended: boolean
): Promise<{ ok: boolean; error?: string }> {
  await requirePlatformOwner();
  const { error } = await adminClient()
    .from("organizations")
    .update({ suspended_at: suspended ? new Date().toISOString() : null })
    .eq("id", orgId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/super/${orgId}`);
  revalidatePath("/super");
  return { ok: true };
}

/**
 * Permanently delete an org and ALL its data (cascades). Requires typing the
 * org's slug to confirm; refuses to delete the demo org this way. Staff only.
 */
export async function deleteOrg(
  orgId: string,
  confirmSlug: string
): Promise<{ ok: boolean; error?: string }> {
  await requirePlatformOwner();
  const supa = adminClient();
  const { data: org } = await supa
    .from("organizations")
    .select("slug")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) return { ok: false, error: "Organization not found." };
  if (org.slug === DEMO_SLUG) {
    return { ok: false, error: "Use 'Rebuild demo' instead of deleting the demo org." };
  }
  if (confirmSlug.trim() !== org.slug) {
    return { ok: false, error: `Type the exact slug (${org.slug}) to confirm.` };
  }
  const { error } = await supa.from("organizations").delete().eq("id", orgId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/super");
  return { ok: true };
}
