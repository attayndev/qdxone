"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";

/** Hide (or re-show) the first-run setup guide. Progress itself is derived. */
export async function setOnboardingDismissed(dismissed: boolean) {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const branding = { ...(org.branding ?? {}), onboarding_dismissed: dismissed };
  const supa = adminClient();
  await supa.from("organizations").update({ branding }).eq("id", org.id);
  revalidatePath("/admin");
  return { ok: true as const };
}
