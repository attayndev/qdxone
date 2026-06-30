import { supabase } from "./supabase";

/**
 * Authed calls to the QDX mobile API. Attaches the current Supabase session JWT
 * as a Bearer token; the server resolves the org from it.
 */
const BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://qdx.one";

export async function apiGet<T>(path: string): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}
