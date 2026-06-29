"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { generateToken } from "@/lib/tokens";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import { getPrimaryLocation, getOrgLocations } from "@/lib/locations";

const PostingSchema = z
  .object({
    // The posting is for a role the operator defined (e.g. "Team Member").
    title: z.string().min(1, "Pick a role").max(120),
    // Which store this posting is for (optional; defaults to the primary store).
    location_id: z.string().uuid().optional().or(z.literal("")),
    // Pay transparency (NY + other states): a good-faith min/max base range.
    pay_min: z.coerce.number().positive("Enter a minimum pay").max(2_000_000),
    pay_max: z.coerce.number().positive("Enter a maximum pay").max(2_000_000),
    pay_period: z.enum(["hour", "year"]),
  })
  .refine((d) => d.pay_max >= d.pay_min, {
    message: "Max pay must be at least the minimum",
    path: ["pay_max"],
  });

type ParsedPosting = {
  title: string;
  location_id?: string;
  pay_min: number;
  pay_max: number;
  pay_period: "hour" | "year";
  tips: boolean;
};

function parsePosting(
  formData: FormData
): { ok: true; data: ParsedPosting } | { ok: false; error: string } {
  const parsed = PostingSchema.safeParse({
    title: formData.get("title") ?? "",
    location_id: formData.get("location_id") ?? "",
    pay_min: formData.get("pay_min") ?? "",
    pay_max: formData.get("pay_max") ?? "",
    pay_period: formData.get("pay_period") ?? "hour",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  return { ok: true, data: { ...parsed.data, tips: formData.get("tips") === "on" } };
}

export type CreatePostingResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export async function createPosting(
  formData: FormData
): Promise<CreatePostingResult> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);

  const parsed = parsePosting(formData);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const v = parsed.data;

  // Resolve the store: a chosen location (verified to be this org's) or the
  // primary store as the default.
  let locationId: string | null = null;
  if (v.location_id) {
    const locs = await getOrgLocations(org.id);
    locationId = locs.find((l) => l.id === v.location_id)?.id ?? null;
  }
  if (!locationId) {
    const primary = await getPrimaryLocation(org.id);
    locationId = primary?.id ?? null;
  }
  if (!locationId) {
    return { ok: false, error: "Set up your store profile first." };
  }

  const supa = adminClient();
  const token = generateToken();
  const { data, error } = await supa
    .from("job_postings")
    // pay_* / tips added in 0015 — not in generated types yet.
    .insert({
      org_id: org.id,
      location_id: locationId,
      title: v.title,
      public_token: token,
      status: "open",
      created_by: m.user_id,
      pay_min: v.pay_min,
      pay_max: v.pay_max,
      pay_period: v.pay_period,
      tips: v.tips,
    } as never)
    .select("public_token")
    .single();

  if (error || !data) {
    console.error("posting insert failed", error);
    return { ok: false, error: "Could not create the posting. Try again." };
  }

  await supa.from("audit_log").insert({
    org_id: org.id,
    actor_user_id: m.user_id,
    action: "posting.created",
    subject_type: "job_posting",
    meta: { role: v.title },
  });

  revalidatePath("/admin/postings");
  return { ok: true, token: data.public_token };
}

export async function setPostingStatus(id: string, status: "open" | "closed") {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const supa = adminClient();
  await supa
    .from("job_postings")
    .update({ status })
    .eq("id", id)
    .eq("org_id", org.id);
  revalidatePath("/admin/postings");
}

/** Fix a posting's role and/or store (e.g. picked the wrong one). */
export async function updatePosting(
  id: string,
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const parsed = parsePosting(formData);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const v = parsed.data;

  const update: Record<string, unknown> = {
    title: v.title,
    pay_min: v.pay_min,
    pay_max: v.pay_max,
    pay_period: v.pay_period,
    tips: v.tips,
  };
  if (v.location_id) {
    const locs = await getOrgLocations(org.id);
    const loc = locs.find((l) => l.id === v.location_id);
    if (loc) update.location_id = loc.id;
  }
  const supa = adminClient();
  await supa.from("job_postings").update(update as never).eq("id", id).eq("org_id", org.id);
  revalidatePath("/admin/postings");
  return { ok: true };
}

/**
 * Delete a posting. Safe unconditionally: applications already snapshot the
 * job title (`positions`), store (`location_id`), and the custom questions
 * asked (`custom_answers` carries each question's label) at submit time — the
 * posting is just a funnel. We sever the nullable back-link, then delete, so
 * candidate records are untouched.
 */
export async function deletePosting(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const supa = adminClient();
  // Sever the back-link first so the delete can't hit an FK restriction;
  // candidates keep their title/store/answers regardless.
  await supa
    .from("applications")
    .update({ job_posting_id: null })
    .eq("job_posting_id", id)
    .eq("org_id", org.id);
  await supa.from("job_postings").delete().eq("id", id).eq("org_id", org.id);
  revalidatePath("/admin/postings");
  return { ok: true };
}
