"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";

const BrandingSchema = z.object({
  name: z.string().min(1).max(120),
  display_name: z.string().max(80).optional().or(z.literal("")),
  location_subtitle: z.string().max(60).optional().or(z.literal("")),
  hero_copy_eyebrow: z.string().max(120).optional().or(z.literal("")),
  hero_copy_h1_pre: z.string().max(120).optional().or(z.literal("")),
  hero_copy_h1_post: z.string().max(120).optional().or(z.literal("")),
  primary_color: z.string().max(20).optional().or(z.literal("")),
  industry: z.string().max(40).optional().or(z.literal("")),
});

export async function updateBranding(formData: FormData) {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);

  const parsed = BrandingSchema.safeParse({
    name: formData.get("name") ?? "",
    display_name: formData.get("display_name") ?? "",
    location_subtitle: formData.get("location_subtitle") ?? "",
    hero_copy_eyebrow: formData.get("hero_copy_eyebrow") ?? "",
    hero_copy_h1_pre: formData.get("hero_copy_h1_pre") ?? "",
    hero_copy_h1_post: formData.get("hero_copy_h1_post") ?? "",
    primary_color: formData.get("primary_color") ?? "",
    industry: formData.get("industry") ?? "",
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  // Spread existing branding so settings saves don't wipe roles,
  // application_config, custom questions, etc.
  const branding = {
    ...(org.branding ?? {}),
    display_name: v.display_name || undefined,
    location_subtitle: v.location_subtitle || undefined,
    hero_copy_eyebrow: v.hero_copy_eyebrow || undefined,
    hero_copy_h1_pre: v.hero_copy_h1_pre || undefined,
    hero_copy_h1_post: v.hero_copy_h1_post || undefined,
    primary_color: v.primary_color || undefined,
    industry: v.industry || undefined,
  };

  const supa = adminClient();
  await supa
    .from("organizations")
    .update({ name: v.name, branding })
    .eq("id", org.id);

  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { ok: true as const };
}
