"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { generateToken } from "@/lib/tokens";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import { getPrimaryLocation, getOrgLocations } from "@/lib/locations";

const PostingSchema = z.object({
  // The posting is for a role the operator defined (e.g. "Team Member").
  title: z.string().min(1, "Pick a role").max(120),
  // Which store this posting is for (optional; defaults to the primary store).
  location_id: z.string().uuid().optional().or(z.literal("")),
});

export type CreatePostingResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export async function createPosting(
  formData: FormData
): Promise<CreatePostingResult> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);

  const parsed = PostingSchema.safeParse({
    title: formData.get("title") ?? "",
    location_id: formData.get("location_id") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Resolve the store: a chosen location (verified to be this org's) or the
  // primary store as the default.
  let locationId: string | null = null;
  if (parsed.data.location_id) {
    const locs = await getOrgLocations(org.id);
    locationId = locs.find((l) => l.id === parsed.data.location_id)?.id ?? null;
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
    .insert({
      org_id: org.id,
      location_id: locationId,
      title: parsed.data.title,
      public_token: token,
      status: "open",
      created_by: m.user_id,
    })
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
    meta: { role: parsed.data.title },
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
  title: string,
  locationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const parsed = PostingSchema.safeParse({ title, location_id: locationId });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const update: { title: string; location_id?: string } = { title: parsed.data.title };
  if (parsed.data.location_id) {
    const locs = await getOrgLocations(org.id);
    const loc = locs.find((l) => l.id === parsed.data.location_id);
    if (loc) update.location_id = loc.id;
  }
  const supa = adminClient();
  await supa.from("job_postings").update(update).eq("id", id).eq("org_id", org.id);
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
