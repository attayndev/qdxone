/**
 * Expo push for the operator app: register a device token and fan a
 * notification out to an org's devices via the Expo Push Service. Tokens that
 * Expo reports as DeviceNotRegistered are pruned so the table self-heals after
 * uninstalls. Service-role; org is the one resolved from the JWT at register
 * time. Best-effort — push never blocks the event that triggered it.
 */

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase/admin";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// `push_tokens` (migration 0016) isn't in the generated types yet, so reach it
// through an untyped view of the service-role client (same trick as eeoAdmin).
function db(): SupabaseClient {
  return adminClient() as unknown as SupabaseClient;
}

export type DevicePlatform = "ios" | "android" | "unknown";

export async function registerPushToken(input: {
  orgId: string;
  userId: string;
  token: string;
  platform: DevicePlatform;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.token.startsWith("ExponentPushToken") && !input.token.startsWith("ExpoPushToken")) {
    return { ok: false, error: "Not an Expo push token." };
  }
  const { error } = await db()
    .from("push_tokens")
    .upsert(
      {
        org_id: input.orgId,
        user_id: input.userId,
        token: input.token,
        platform: input.platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" }
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  sound: "default";
  data?: Record<string, unknown>;
}

interface ExpoTicket {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

/**
 * Send one notification to every device registered to an org. Chunked to Expo's
 * 100-message limit; prunes tokens Expo rejects as DeviceNotRegistered.
 */
export async function sendOrgPush(args: {
  orgId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const supa = db();
  const { data: rows } = await supa
    .from("push_tokens")
    .select("token")
    .eq("org_id", args.orgId);
  const tokens = ((rows as { token: string }[] | null) ?? []).map((r) => r.token);
  if (tokens.length === 0) return;

  const dead: string[] = [];
  for (let i = 0; i < tokens.length; i += 100) {
    const chunk = tokens.slice(i, i + 100);
    const messages: ExpoMessage[] = chunk.map((to) => ({
      to,
      title: args.title,
      body: args.body,
      sound: "default",
      data: args.data,
    }));
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { data?: ExpoTicket[] };
      const tickets = json.data ?? [];
      tickets.forEach((t, idx) => {
        if (t.status === "error" && t.details?.error === "DeviceNotRegistered") {
          dead.push(chunk[idx]);
        }
      });
    } catch {
      // Network hiccup — skip this chunk; the next event retries.
    }
  }

  if (dead.length > 0) {
    await supa.from("push_tokens").delete().in("token", dead);
  }
}
