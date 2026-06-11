import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role Supabase client. Bypasses RLS — only use server-side,
 * never ship the key to the browser. Used by the public applicant flow
 * (invitation lookup + response writes) where the visitor isn't signed
 * in to Supabase Auth.
 */
let cached: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function adminClient() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  cached = createSupabaseClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/**
 * Service-role client scoped to the locked `eeo` schema. EEO data lives in a
 * separate Postgres schema with RLS denying anon/authenticated entirely — so
 * ONLY this server-side service-role path can read or write it. Operators
 * (and their session clients) can never reach individual EEO rows; reporting
 * exposes aggregates only. Untyped because the generated types cover `public`.
 */
export function eeoAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).schema("eeo");
}
