import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { authCookieDomain } from "@/lib/host";

export function createClient() {
  // Match the server's cookie domain so a session refreshed client-side
  // stays shared across `*.qdx.one` (no duplicate host-only cookie).
  const domain =
    typeof window !== "undefined"
      ? authCookieDomain(window.location.host)
      : undefined;
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    domain ? { cookieOptions: { domain } } : undefined
  );
}
