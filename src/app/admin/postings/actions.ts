"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { generateToken } from "@/lib/invitations";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import { getPrimaryLocation } from "@/lib/locations";

const PostingSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  role_type: z.enum(["crew", "shift_lead", "gm"]),
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
    role_type: formData.get("role_type") ?? "crew",
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
      role_type: parsed.data.role_type,
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
    meta: { title: parsed.data.title, role_type: parsed.data.role_type },
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
