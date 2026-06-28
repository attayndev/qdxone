"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import type { CareersCopy } from "@/lib/careers-copy";

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
 * "Style my page like <url>" — scrape the operator's own site and return a
 * DRAFT brand token set AND a draft of the careers-page body copy (both AI-
 * assisted; nothing saved until applied). Brand still returns if copy drafting
 * fails.
 */
export async function fetchBrandFromUrl(url: string) {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  if (!url?.trim()) return { ok: false as const, error: "Enter your website URL." };

  const { extractBrandFromUrl } = await import("@/lib/brand-extract");
  const res = await extractBrandFromUrl(url);
  if (!res.ok) return res;

  let copy: CareersCopy | undefined;
  try {
    const { generateCareersCopy } = await import("@/lib/careers-copy-generate");
    const gen = await generateCareersCopy({
      orgName: org.name,
      industry: org.branding?.industry,
      roles: org.branding?.roles,
      siteText: res.siteText,
    });
    if (gen.ok) copy = gen.copy;
  } catch {
    /* copy is optional — brand draft still returns */
  }

  return { ok: true as const, tokens: res.tokens, copy, source: res.source };
}

/** Draft (or re-draft) careers copy from what we know about the org — no URL. */
export async function draftCareersCopy() {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const { generateCareersCopy } = await import("@/lib/careers-copy-generate");
  return generateCareersCopy({
    orgName: org.name,
    industry: org.branding?.industry,
    roles: org.branding?.roles,
  });
}

/** Upload a logo image to public Storage; returns its public URL. */
export async function uploadLogo(formData: FormData) {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Choose an image file." };
  }
  if (file.size > 2_000_000) {
    return { ok: false as const, error: "Logo must be under 2 MB." };
  }
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const supa = adminClient();
  // Idempotent: create the public bucket on first use.
  try {
    await supa.storage.createBucket("branding", { public: true });
  } catch {
    /* already exists */
  }
  const path = `${org.id}/logo-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supa.storage
    .from("branding")
    .upload(path, bytes, { contentType: file.type || "image/png", upsert: true });
  if (error) return { ok: false as const, error: `Upload failed: ${error.message}` };
  const { data } = supa.storage.from("branding").getPublicUrl(path);
  return { ok: true as const, url: data.publicUrl };
}

const TokensSchema = z.object({
  primary_color: z.string().optional(),
  accent_color: z.string().optional(),
  bg_color: z.string().optional(),
  ink_color: z.string().optional(),
  font_family: z.string().optional(),
  logo_url: z.string().optional(),
});

const CopySchema = z.object({
  subhead: z.string().optional(),
  lookForIntro: z.string().optional(),
  values: z
    .array(
      z.object({
        emoji: z.string().optional(),
        title: z.string(),
        body: z.string(),
      })
    )
    .optional(),
  roleIntro: z.string().optional(),
  rolePoints: z.array(z.string()).optional(),
});

/** Persist chosen brand tokens + careers copy onto org.branding. */
export async function applyBrand(payload: unknown) {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const parsed = z
    .object({ tokens: TokensSchema.optional(), copy: CopySchema.optional() })
    .safeParse(payload);
  if (!parsed.success) return { ok: false as const, error: "Invalid brand payload." };
  const { tokens, copy } = parsed.data;

  // Spread existing branding so we never wipe roles/application config/etc.
  const branding = { ...(org.branding ?? {}) };

  if (tokens) {
    for (const [k, val] of Object.entries(tokens)) {
      if (typeof val === "string" && val.trim()) {
        (branding as Record<string, unknown>)[k] = val.trim();
      }
    }
  }
  if (copy) {
    if (copy.subhead?.trim()) branding.hero_copy_subhead = copy.subhead.trim();
    if (copy.lookForIntro?.trim()) branding.look_for_intro = copy.lookForIntro.trim();
    if (copy.values?.length) {
      branding.values = copy.values
        .filter((v) => v.title?.trim() && v.body?.trim())
        .map((v) => ({
          emoji: v.emoji?.trim() || undefined,
          title: v.title.trim(),
          body: v.body.trim(),
        }));
    }
    if (copy.roleIntro !== undefined) branding.role_intro = copy.roleIntro.trim() || undefined;
    if (copy.rolePoints?.length) {
      branding.role_points = copy.rolePoints.map((s) => s.trim()).filter(Boolean);
    }
  }

  const supa = adminClient();
  await supa.from("organizations").update({ branding }).eq("id", org.id);
  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { ok: true as const };
}
