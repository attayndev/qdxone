/**
 * Authenticated encryption for calendar OAuth tokens at rest. AES-256-GCM via
 * node:crypto (the app runs on real Node in Cloudflare Containers). The 32-byte
 * key comes from the CALENDAR_TOKEN_KEY secret (base64); it never lives in the
 * database. `enc_key_version` on the row + the version prefix here let us rotate
 * the key later without guessing which key sealed a given row.
 *
 * Ciphertext format (compact, self-describing): `v<ver>.<iv>.<tag>.<ct>` with
 * each part base64url. `decrypt` authenticates the tag, so tampering throws.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export const KEY_VERSION = 1;
const IV_BYTES = 12; // GCM standard nonce length

let cachedKey: Buffer | null = null;

/** Load + validate the 32-byte key from CALENDAR_TOKEN_KEY (base64). */
export function loadKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.CALENDAR_TOKEN_KEY;
  if (!raw) {
    throw new Error(
      "CALENDAR_TOKEN_KEY is not set — calendar tokens cannot be encrypted/decrypted"
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `CALENDAR_TOKEN_KEY must decode to 32 bytes (got ${key.length}); generate with \`openssl rand -base64 32\``
    );
  }
  cachedKey = key;
  return key;
}

const b64u = (b: Buffer) => b.toString("base64url");

export function encrypt(plaintext: string, key: Buffer = loadKey()): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v${KEY_VERSION}.${b64u(iv)}.${b64u(tag)}.${b64u(ct)}`;
}

export function decrypt(payload: string, key: Buffer = loadKey()): string {
  const parts = payload.split(".");
  if (parts.length !== 4 || !parts[0].startsWith("v")) {
    throw new Error("Malformed ciphertext");
  }
  const [, ivB64, tagB64, ctB64] = parts;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const ct = Buffer.from(ctB64, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/** Encrypt a token, returning null for null/empty input (refresh tokens are optional). */
export function encryptToken(plaintext: string | null | undefined): string | null {
  if (!plaintext) return null;
  return encrypt(plaintext);
}

export function decryptToken(payload: string | null | undefined): string | null {
  if (!payload) return null;
  return decrypt(payload);
}
