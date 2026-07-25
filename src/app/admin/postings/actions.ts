"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import { getOrgLocations } from "@/lib/locations";
import {
  parsePostingInput,
  createJobPosting,
  type RawPostingInput,
  type CreatePostingResult,
} from "@/lib/postings";

export type { CreatePostingResult };

/** Pull the posting fields out of submitted form data for validation. */
function rawFromForm(formData: FormData): RawPostingInput {
  return {
    title: formData.get("title"),
    location_id: formData.get("location_id"),
    pay_min: formData.get("pay_min"),
    pay_max: formData.get("pay_max"),
    pay_period: formData.get("pay_period"),
    tips: formData.get("tips"),
    work_experience_mode: formData.get("work_experience_mode"),
    references_mode: formData.get("references_mode"),
  };
}

export async function createPosting(
  formData: FormData
): Promise<CreatePostingResult> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);

  const parsed = parsePostingInput(rawFromForm(formData));
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const result = await createJobPosting(org.id, m.user_id, parsed.data);
  if (result.ok) revalidatePath("/admin/postings");
  return result;
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
  // TEMP DIAGNOSTIC: surface what the form actually submitted, on-screen, so we
  // can see it without live logs. Remove after diagnosis.
  const DIAG = true;
  if (DIAG) {
    return {
      ok: false,
      error: `DIAG — server received: work="${formData.get("work_experience_mode")}" refs="${formData.get("references_mode")}" | fields=[${[...formData.keys()].join(", ")}]`,
    };
  }

  const parsed = parsePostingInput(rawFromForm(formData));
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const v = parsed.data;

  const update: Record<string, unknown> = {
    title: v.title,
    pay_min: v.pay_min,
    pay_max: v.pay_max,
    pay_period: v.pay_period,
    tips: v.tips,
    work_experience_mode: v.work_experience_mode,
    references_mode: v.references_mode,
  };
  if (v.location_id) {
    const locs = await getOrgLocations(org.id);
    const loc = locs.find((l) => l.id === v.location_id);
    if (loc) update.location_id = loc.id;
  }
  const supa = adminClient();
  const { error } = await supa
    .from("job_postings")
    .update(update as never)
    .eq("id", id)
    .eq("org_id", org.id);
  if (error) {
    console.error("posting update failed", error);
    return { ok: false, error: "Could not save the posting. Try again." };
  }
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
