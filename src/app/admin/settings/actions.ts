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

/**
 * "Style my page like <url>" — scrape brand signals off the operator's own
 * website and return a DRAFT token set (not saved; the operator previews +
 * applies it). See lib/brand-extract.ts.
 */
export async function fetchBrandFromUrl(url: string) {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  if (!url?.trim()) return { ok: false as const, error: "Enter your website URL." };
  const { extractBrandFromUrl } = await import("@/lib/brand-extract");
  return extractBrandFromUrl(url);
}

const TokensSchema = z.object({
  primary_color: z.string().optional(),
  accent_color: z.string().optional(),
  bg_color: z.string().optional(),
  ink_color: z.string().optional(),
  font_family: z.string().optional(),
  logo_url: z.string().optional(),
});

/** Persist the operator's chosen brand tokens onto org.branding. */
export async function applyBrandTokens(tokens: unknown) {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const parsed = TokensSchema.safeParse(tokens);
  if (!parsed.success) return { ok: false as const, error: "Invalid brand tokens." };

  // Only write keys that have a value; spread existing branding so we don't
  // wipe copy/roles/application config.
  const t = parsed.data;
  const branding = { ...(org.branding ?? {}) };
  for (const [k, val] of Object.entries(t)) {
    if (typeof val === "string" && val.trim()) {
      (branding as Record<string, unknown>)[k] = val.trim();
    }
  }

  const supa = adminClient();
  await supa.from("organizations").update({ branding }).eq("id", org.id);
  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { ok: true as const };
}
