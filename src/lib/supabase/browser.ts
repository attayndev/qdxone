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
    Object.keys(overrides).length ? { cookieOptions: overrides } : undefined
  );
}
