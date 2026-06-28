/**
 * Signed OAuth `state`. Because one Google app serves every tenant, the callback
 * lands on the apex with no session context — the state is how it learns which
 * org/user/subdomain initiated the connect, and the HMAC signature is what stops
 * a forged callback from binding a calendar to someone else's org (CSRF).
 *
 * Signed with an HMAC key derived from CALENDAR_TOKEN_KEY (already a secret), so
 * no extra secret to manage. Short TTL; single-use is enforced separately by a
 * nonce cookie the connect route sets and the callback checks.
 */

import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { loadKey } from "./crypto";

const TTL_MS = 10 * 60 * 1000; // 10 minutes to complete consent

export interface OAuthState {
  orgId: string;
  userId: string;
  slug: string;
  provider: "google" | "microsoft";
  nonce: string;
  iat: number;
}

function hmacKey(): Buffer {
  // Domain-separated from token encryption so the two never share a raw key.
  return createHmac("sha256", loadKey()).update("oauth-state-v1").digest();
}

function sign(payloadB64: string): string {
  return createHmac("sha256", hmacKey()).update(payloadB64).digest("base64url");
}

export function newNonce(): string {
  return randomBytes(16).toString("base64url");
}

export function encodeState(s: Omit<OAuthState, "iat">): string {
  const full: OAuthState = { ...s, iat: Date.now() };
  const payload = Buffer.from(JSON.stringify(full)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Verify signature + freshness. Returns the state or null if invalid/expired. */
export function decodeState(raw: string | null): OAuthState | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as OAuthState;
    if (typeof s.iat !== "number" || Date.now() - s.iat > TTL_MS) return null;
    return s;
  } catch {
    return null;
  }
}
