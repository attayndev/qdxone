import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { authCookieOverrides } from "@/lib/host";

/**
 * Server-side Supabase client bound to the user's auth cookies.
 * Use this from Server Components, Server Actions, and Route Handlers
 * that need to act AS the signed-in admin (RLS applies).
 */
export async function createClient() {
  const cookieStore = await cookies();
  const overrides = authCookieOverrides((await headers()).get("host"));
  return createServerClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            for (const { name, value, options } of toSet) {
              cookieStore.set(name, value, { ...options, ...overrides });
            }
          } catch {
            // Called from a Server Component — cookies are read-only.
            // proxy.ts is responsible for refreshing the session.
          }
        },
      },
    }
  );
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
