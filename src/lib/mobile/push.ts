/**
 * Expo push for the operator app: register a device token and fan a
 * notification out to an org's devices via the Expo Push Service. Tokens that
 * Expo reports as DeviceNotRegistered are pruned so the table self-heals after
 * uninstalls. Service-role; org is the one resolved from the JWT at register
 * time. Best-effort — push never blocks the event that triggered it.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

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
  const { error } = await adminClient()
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
  /** Skip this user's own devices (e.g. don't notify the person who acted). */
  excludeUserId?: string;
}): Promise<void> {
  const supa = adminClient();
  let query = supa.from("push_tokens").select("token").eq("org_id", args.orgId);
  if (args.excludeUserId) query = query.neq("user_id", args.excludeUserId);
  const { data: rows } = await query;
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
