"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import type { NotifyPrefs } from "@/lib/notify-prefs";

/** Save the CURRENT member's own notification preferences + phone. */
export async function saveNotifyPrefs(prefs: NotifyPrefs, phone: string) {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);
  if (!m) return { ok: false as const, error: "Not a member of this org." };
  const supa = adminClient();
  await supa
    .from("org_members")
    // notify_prefs/phone added in migration 0011 — not in generated types yet.
    .update({ notify_prefs: prefs, phone: phone.trim() || null } as never)
    .eq("org_id", org.id)
    .eq("user_id", m.user_id);
  revalidatePath("/admin/notifications");
  return { ok: true as const };
}

/** Save the CURRENT user's name (person-level, on their auth user_metadata). */
export async function saveProfile(firstName: string, lastName: string) {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);
  if (!m) return { ok: false as const, error: "Not a member of this org." };
  const supa = adminClient();
  // Merge so we don't clobber other metadata (e.g. signup_org_id).
  const { data: existing } = await supa.auth.admin.getUserById(m.user_id);
  await supa.auth.admin.updateUserById(m.user_id, {
    user_metadata: {
      ...(existing.user?.user_metadata ?? {}),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    },
  });
  revalidatePath("/admin/notifications");
  return { ok: true as const };
}
