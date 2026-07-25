/**
 * Shared job-posting create + validation. One code path for the web server
 * action and the mobile API, so pay-transparency rules and the insert/audit
 * stay identical regardless of surface. Caller handles cache revalidation /
 * response shaping.
 */

import "server-only";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { generateToken } from "@/lib/tokens";
import { getPrimaryLocation, getOrgLocations } from "@/lib/locations";
import type { FieldMode } from "@/lib/supabase/types";

// Per-posting field-mode override: one of the three modes, or "" (= inherit
// the org default). Empty string normalizes to null in the parsed output.
const FieldModeOverride = z
  .enum(["hidden", "optional", "required"])
  .or(z.literal(""))
  .optional();

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
    work_experience_mode: FieldModeOverride,
    references_mode: FieldModeOverride,
  })
  .refine((d) => d.pay_max >= d.pay_min, {
    message: "Max pay must be at least the minimum",
    path: ["pay_max"],
  });

export interface PostingInput {
  title: string;
  location_id?: string;
  pay_min: number;
  pay_max: number;
  pay_period: "hour" | "year";
  tips: boolean;
  // null = inherit the org default (branding.application_config).
  work_experience_mode: FieldMode | null;
  references_mode: FieldMode | null;
}

/** Raw fields from a form (strings) or a JSON body (mixed); validated here. */
export interface RawPostingInput {
  title?: unknown;
  location_id?: unknown;
  pay_min?: unknown;
  pay_max?: unknown;
  pay_period?: unknown;
  tips?: unknown;
  work_experience_mode?: unknown;
  references_mode?: unknown;
}

export function parsePostingInput(
  raw: RawPostingInput
): { ok: true; data: PostingInput } | { ok: false; error: string } {
  const parsed = PostingSchema.safeParse({
    title: raw.title ?? "",
    location_id: raw.location_id ?? "",
    pay_min: raw.pay_min ?? "",
    pay_max: raw.pay_max ?? "",
    pay_period: raw.pay_period ?? "hour",
    work_experience_mode: raw.work_experience_mode ?? "",
    references_mode: raw.references_mode ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  // Tips arrives as a checkbox ("on") from a form or a boolean from JSON.
  const tips = raw.tips === true || raw.tips === "on";
  return {
    ok: true,
    data: {
      ...parsed.data,
      tips,
      work_experience_mode: parsed.data.work_experience_mode || null,
      references_mode: parsed.data.references_mode || null,
    },
  };
}

export type CreatePostingResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

/**
 * Resolve the store (chosen location verified to be this org's, else the
 * primary), insert the posting, and write the audit entry. Does NOT revalidate
 * any cache — the caller owns that.
 */
export async function createJobPosting(
  orgId: string,
  userId: string,
  input: PostingInput
): Promise<CreatePostingResult> {
  let locationId: string | null = null;
  if (input.location_id) {
    const locs = await getOrgLocations(orgId);
    locationId = locs.find((l) => l.id === input.location_id)?.id ?? null;
  }
  if (!locationId) {
    const primary = await getPrimaryLocation(orgId);
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
      org_id: orgId,
      location_id: locationId,
      title: input.title,
      public_token: token,
      status: "open",
      created_by: userId,
      pay_min: input.pay_min,
      pay_max: input.pay_max,
      pay_period: input.pay_period,
      tips: input.tips,
      work_experience_mode: input.work_experience_mode,
      references_mode: input.references_mode,
    } as never)
    .select("public_token")
    .single();

  if (error || !data) {
    console.error("posting insert failed", error);
    return { ok: false, error: "Could not create the posting. Try again." };
  }

  await supa.from("audit_log").insert({
    org_id: orgId,
    actor_user_id: userId,
    action: "posting.created",
    subject_type: "job_posting",
    meta: { role: input.title },
  });

  return { ok: true, token: data.public_token };
}
