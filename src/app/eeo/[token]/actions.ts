"use server";

import { adminClient, eeoAdmin } from "@/lib/supabase/admin";

export type EeoPayload = {
  declined: boolean;
  race_ethnicity?: string | null;
  gender?: string | null;
  veteran_status?: string | null;
  disability_status?: string | null;
};

/**
 * Record a candidate's voluntary EEO self-ID (or their decline) in the locked
 * `eeo` schema, keyed to the application. Idempotent — one row per application.
 */
export async function saveEeo(
  token: string,
  payload: EeoPayload
): Promise<{ ok: boolean }> {
  const supa = adminClient();
  const { data: session } = await supa
    .from("assessment_sessions")
    .select("application_id, org_id")
    .eq("access_token", token)
    .maybeSingle();
  if (!session?.application_id) return { ok: false };

  const eeo = eeoAdmin();
  const { data: existing } = await eeo
    .from("responses")
    .select("id")
    .eq("application_id", session.application_id)
    .maybeSingle();
  if (existing) return { ok: true }; // already recorded; don't overwrite

  await eeo.from("responses").insert({
    application_id: session.application_id,
    org_id: session.org_id,
    declined: payload.declined,
    race_ethnicity: payload.declined ? null : payload.race_ethnicity ?? null,
    gender: payload.declined ? null : payload.gender ?? null,
    veteran_status: payload.declined ? null : payload.veteran_status ?? null,
    disability_status: payload.declined ? null : payload.disability_status ?? null,
  });
  return { ok: true };
}
