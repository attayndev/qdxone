/**
 * Calendar connection store. Owns the encrypted-token lifecycle: seal tokens on
 * save, hand out a *fresh* plaintext access token on demand (transparently
 * refreshing + re-persisting when expired), and tear a connection down. All
 * access is via adminClient() (service role) — calendar_connections is
 * service-role-only at the RLS layer. Plaintext tokens never leave this module's
 * callers' server context.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { encryptToken, decrypt, KEY_VERSION } from "./crypto";
import { googleProvider, revokeGoogleToken } from "@/lib/calendar-providers/google";
import type { CalendarProvider, CalendarProviderId } from "@/lib/calendar-providers/provider";

const PROVIDERS: Record<CalendarProviderId, CalendarProvider> = {
  google: googleProvider,
  microsoft: googleProvider, // placeholder until the MS impl lands; never selected in v1
};

const TABLE = "calendar_connections";
const REFRESH_SKEW_MS = 60_000; // refresh a minute before actual expiry

interface ConnectionRow {
  id: string;
  org_id: string;
  user_id: string;
  provider: CalendarProviderId;
  external_account_id: string | null;
  enc_access_token: string | null;
  enc_refresh_token: string | null;
  enc_key_version: number;
  token_expires_at: string | null;
  availability_calendar_id: string | null;
  booking_calendar_id: string | null;
  status: "connected" | "expired" | "revoked";
}

export interface SaveConnectionInput {
  orgId: string;
  userId: string;
  provider: CalendarProviderId;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  externalAccountId: string | null;
}

export async function saveConnection(input: SaveConnectionInput): Promise<void> {
  const supa = adminClient();
  const row = {
    org_id: input.orgId,
    user_id: input.userId,
    provider: input.provider,
    external_account_id: input.externalAccountId,
    enc_access_token: encryptToken(input.accessToken),
    enc_refresh_token: encryptToken(input.refreshToken),
    enc_key_version: KEY_VERSION,
    token_expires_at: input.expiresAt.toISOString(),
    status: "connected" as const,
    last_sync_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  // Upsert on the (org_id, user_id, provider) unique key. On reconnect we keep
  // an existing refresh token if Google didn't return a new one.
  const { error } = await supa
    .from(TABLE)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(row as any, { onConflict: "org_id,user_id,provider" });
  if (error) throw new Error(`saveConnection: ${error.message}`);
}

async function getRow(
  orgId: string,
  userId: string,
  provider: CalendarProviderId
): Promise<ConnectionRow | null> {
  const supa = adminClient();
  const { data } = await supa
    .from(TABLE)
    .select("*")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();
  return (data as ConnectionRow | null) ?? null;
}

/** Public, token-free view for the settings UI. */
export interface ConnectionStatus {
  provider: CalendarProviderId;
  status: "connected" | "expired" | "revoked";
  email: string | null;
}

export async function listConnectionStatuses(
  orgId: string,
  userId: string
): Promise<ConnectionStatus[]> {
  const supa = adminClient();
  const { data } = await supa
    .from(TABLE)
    .select("provider, status, external_account_id")
    .eq("org_id", orgId)
    .eq("user_id", userId);
  return ((data as Pick<ConnectionRow, "provider" | "status" | "external_account_id">[]) ?? []).map(
    (r) => ({ provider: r.provider, status: r.status, email: r.external_account_id })
  );
}

/**
 * Return a valid plaintext access token for a connection, refreshing and
 * re-persisting if it's expired. Throws if there's no usable connection — the
 * caller (availability / event create) decides how to degrade.
 */
export async function getFreshAccessToken(
  orgId: string,
  userId: string,
  provider: CalendarProviderId
): Promise<string> {
  const row = await getRow(orgId, userId, provider);
  if (!row || row.status === "revoked" || !row.enc_access_token) {
    throw new Error("No active calendar connection");
  }
  const notExpired =
    row.token_expires_at &&
    new Date(row.token_expires_at).getTime() - REFRESH_SKEW_MS > Date.now();
  if (notExpired) return decrypt(row.enc_access_token);

  // Expired → refresh with the stored refresh token.
  if (!row.enc_refresh_token) {
    await markExpired(orgId, userId, provider);
    throw new Error("Calendar connection expired and has no refresh token");
  }
  const refreshToken = decrypt(row.enc_refresh_token);
  const refreshed = await PROVIDERS[provider].refreshConnection({ refreshToken });
  const supa = adminClient();
  const patch: Record<string, unknown> = {
    enc_access_token: encryptToken(refreshed.accessToken),
    token_expires_at: refreshed.expiresAt.toISOString(),
    status: "connected",
    last_sync_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (refreshed.refreshToken) patch.enc_refresh_token = encryptToken(refreshed.refreshToken);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supa.from(TABLE).update(patch as any).eq("id", row.id);
  return refreshed.accessToken;
}

async function markExpired(
  orgId: string,
  userId: string,
  provider: CalendarProviderId
): Promise<void> {
  await adminClient()
    .from(TABLE)
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("provider", provider);
}

/** Disconnect: best-effort provider revoke, then mark revoked + drop tokens. */
export async function disconnect(
  orgId: string,
  userId: string,
  provider: CalendarProviderId
): Promise<void> {
  const row = await getRow(orgId, userId, provider);
  if (!row) return;
  if (provider === "google" && row.enc_refresh_token) {
    await revokeGoogleToken(decrypt(row.enc_refresh_token)).catch(() => {});
  }
  await adminClient()
    .from(TABLE)
    .update({
      status: "revoked",
      enc_access_token: null,
      enc_refresh_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);
}
