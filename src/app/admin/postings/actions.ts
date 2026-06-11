"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { generateToken } from "@/lib/invitations";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import { getPrimaryLocation } from "@/lib/locations";

const PostingSchema = z.object({
  // The posting is for a role the operator defined (e.g. "Team Member").
  title: z.string().min(1, "Pick a role").max(120),
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
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const location = await getPrimaryLocation(org.id);
  if (!location) {
    return { ok: false, error: "Set up your store profile first." };
  }

  const supa = adminClient();
  const token = generateToken();
  const { data, error } = await supa
    .from("job_postings")
    .insert({
      org_id: org.id,
      location_id: location.id,
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
