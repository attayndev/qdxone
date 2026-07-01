"use server";

import { requirePlatformOwner } from "@/lib/super/guard";
import { resetDemoOrg } from "@/lib/demo/seed";

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
