import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { authCookieOverrides } from "@/lib/host";

export function createClient() {
  // Match the server's cookie domain + (dev) non-secure flag so a session
  // refreshed client-side stays shared across `*.qdx.one` / `*.lvh.me`.
  const overrides =
    typeof window !== "undefined"
      ? authCookieOverrides(window.location.host)
      : {};
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Implicit flow (not PKCE) so login magic links carry a plain `token_hash`
      // that /auth/callback verifies with verifyOtp() — no code-verifier cookie
      // needed. Must match the server client (see lib/supabase/server.ts), or
      // login links get a `pkce_` token that 500s on verify. Signup sends via
      // the server client; login sends via this one.
      auth: { flowType: "implicit" },
      ...(Object.keys(overrides).length ? { cookieOptions: overrides } : {}),
    }
  );
}
