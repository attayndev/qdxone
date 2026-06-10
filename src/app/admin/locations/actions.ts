"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import { getPrimaryLocation } from "@/lib/locations";

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
