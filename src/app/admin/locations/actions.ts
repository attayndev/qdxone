"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import { getPrimaryLocation } from "@/lib/locations";
import type { CustomQuestion } from "@/lib/supabase/types";

const LocationSchema = z.object({
  name: z.string().min(1, "Store name is required").max(120),
  address_line1: z.string().max(160).optional().or(z.literal("")),
  address_line2: z.string().max(160).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  region: z.string().max(80).optional().or(z.literal("")),
  postal_code: z.string().max(20).optional().or(z.literal("")),
  timezone: z.string().max(60).optional().or(z.literal("")),
});

export type SaveLocationResult =
  | { ok: true }
  | { ok: false; error: string };

/** Create or update the org's (single, in MVP) store profile. */
export async function saveLocation(
  formData: FormData
): Promise<SaveLocationResult> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);

  const parsed = LocationSchema.safeParse({
    name: formData.get("name") ?? "",
    address_line1: formData.get("address_line1") ?? "",
    address_line2: formData.get("address_line2") ?? "",
    city: formData.get("city") ?? "",
    region: formData.get("region") ?? "",
    postal_code: formData.get("postal_code") ?? "",
    timezone: formData.get("timezone") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const payload = {
    org_id: org.id,
    name: v.name,
    address_line1: v.address_line1 || null,
    address_line2: v.address_line2 || null,
    city: v.city || null,
    region: v.region || null,
    postal_code: v.postal_code || null,
    timezone: v.timezone || "America/New_York",
  };

  const supa = adminClient();
  const existing = await getPrimaryLocation(org.id);
  if (existing) {
    await supa.from("locations").update(payload).eq("id", existing.id);
  } else {
    await supa.from("locations").insert(payload);
  }

  revalidatePath("/admin/locations");
  revalidatePath("/admin/postings");
  return { ok: true };
}

/**
 * Save the org's role list (operator-defined; e.g. Team Member, Shift Lead).
 * Postings pick from these, and the chosen role is recorded on each
 * application so scoring/benchmarks can be computed per role later.
 */
export async function saveRoles(
  roles: { name: string; description?: string }[]
): Promise<SaveLocationResult> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);

  const seen = new Set<string>();
  const names: string[] = [];
  const descriptions: Record<string, string> = {};
  for (const r of roles) {
    const name = r.name.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
    const d = r.description?.trim();
    if (d) descriptions[name] = d;
    if (names.length >= 25) break;
  }
  if (names.length === 0) {
    return { ok: false, error: "Add at least one role." };
  }

  const supa = adminClient();
  const branding = {
    ...(org.branding ?? {}),
    roles: names,
    role_descriptions: descriptions,
  };
  await supa.from("organizations").update({ branding }).eq("id", org.id);

  revalidatePath("/admin/locations");
  revalidatePath("/admin/postings");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Draft a job description with AI from the role name + the operator's notes.
 * Uses the AI SDK through the Vercel AI Gateway. Gracefully errors if no AI
 * key is configured.
 */
export async function generateRoleDescription(
  roleName: string,
  brief: string
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const name = roleName.trim();
  if (!name) return { ok: false, error: "Name the role first." };

  try {
    const { generateText } = await import("ai");
    const model = process.env.AI_MODEL ?? "anthropic/claude-haiku-4.5";
    const { text } = await generateText({
      model,
      prompt:
        `Write a short, welcoming job description for a "${name}" role at the restaurant "${org.name}", aimed at entry-level applicants. ` +
        (brief.trim()
          ? `Use these details from the operator: ${brief.trim()}. `
          : "") +
        `Keep it to 3-5 sentences, plain language at about a 7th-grade reading level, friendly and honest. Just a short paragraph — no title, no salary, no bullet points.`,
    });
    return { ok: true, text: text.trim() };
  } catch (e) {
    console.error("AI job description failed", e);
    return {
      ok: false,
      error: "AI isn't set up yet (needs AI_GATEWAY_API_KEY).",
    };
  }
}

/**
 * Toggle whether applications auto-send the assessment, or the manager
 * reviews first and sends it manually (to filter joke applications).
 */
export async function saveAssessmentMode(
  autoSend: boolean
): Promise<SaveLocationResult> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const supa = adminClient();
  const branding = { ...(org.branding ?? {}), auto_send_assessment: autoSend };
  await supa.from("organizations").update({ branding }).eq("id", org.id);
  revalidatePath("/admin/locations");
  return { ok: true };
}

/** Save the application-form field config (work experience / references). */
export async function saveApplicationConfig(config: {
  work_experience: "hidden" | "optional" | "required";
  references: "hidden" | "optional" | "required";
}): Promise<SaveLocationResult> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const supa = adminClient();
  const branding = {
    ...(org.branding ?? {}),
    application_config: { ...(org.branding?.application_config ?? {}), ...config },
  };
  await supa.from("organizations").update({ branding }).eq("id", org.id);
  revalidatePath("/admin/locations");
  return { ok: true };
}

/** Save the operator's custom application questions. */
export async function saveCustomQuestions(
  questions: CustomQuestion[]
): Promise<SaveLocationResult> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const clean = questions
    .map((q) => ({
      id: q.id,
      label: q.label.trim(),
      type: q.type,
      required: !!q.required,
    }))
    .filter((q) => q.label)
    .slice(0, 15);
  const supa = adminClient();
  const branding = {
    ...(org.branding ?? {}),
    application_config: {
      ...(org.branding?.application_config ?? {}),
      custom_questions: clean,
    },
  };
  await supa.from("organizations").update({ branding }).eq("id", org.id);
  revalidatePath("/admin/locations");
  return { ok: true };
}
