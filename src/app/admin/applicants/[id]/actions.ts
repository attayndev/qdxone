"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { HiringStatus } from "@/lib/supabase/types";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";

async function requireUser() {
  const supa = await createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  return { supa, user, org };
}

export async function updateHiringStatus(
  applicantId: string,
  status: HiringStatus
) {
  const { supa, org } = await requireUser();
  await supa
    .from("applicants")
    .update({ hiring_status: status })
    .eq("id", applicantId)
    .eq("org_id", org.id);
  revalidatePath(`/admin/applicants/${applicantId}`);
  revalidatePath("/admin/applicants");
}

export async function addNote(applicantId: string, body: string) {
  if (!body.trim()) return;
  const { supa, user, org } = await requireUser();
  await supa.from("admin_notes").insert({
    org_id: org.id,
    applicant_id: applicantId,
    author_id: user.id,
    author_email: user.email ?? null,
    body: body.trim(),
  });
  revalidatePath(`/admin/applicants/${applicantId}`);
}
