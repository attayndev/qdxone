import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Magic-link SENDER client — implicit flow, not PKCE.
 *
 * WHY A SEPARATE CLIENT: @supabase/ssr's createBrowserClient/createServerClient
 * hard-assign `flowType: "pkce"` AFTER spreading your options, so passing
 * `auth: { flowType: "implicit" }` to them is silently ignored. PKCE makes
 * signInWithOtp emit a `pkce_` token that verifyOtp() can't validate without a
 * code-verifier cookie — and that cookie doesn't survive the send→click hop
 * across apex↔subdomain / server↔browser, which is the 500 on /auth/callback.
 *
 * Plain supabase-js DOES honor flowType, so the SEND goes through this client.
 * Implicit emits a plain `token_hash`; /auth/callback verifies it with
 * verifyOtp() and no cookie. This never persists a session (the callback owns
 * that) — it only calls signInWithOtp. Anon key is public; safe in the browser.
 */
export function otpClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return createClient<Database>(url, anonKey, {
    auth: {
      flowType: "implicit",
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
