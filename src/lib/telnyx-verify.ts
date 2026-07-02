import "server-only";
import { createPublicKey, verify as edVerify } from "node:crypto";

/**
 * Verify a Telnyx webhook's Ed25519 signature.
 * Telnyx signs `${timestamp}|${rawBody}` and sends the base64 signature in
 * `telnyx-signature-ed25519` with `telnyx-timestamp`. The account's public key
 * (base64, 32 bytes) goes in TELNYX_PUBLIC_KEY.
 *
 * Returns:
 *   "ok"        — signature valid
 *   "invalid"   — signature present but bad, or too old (replay) → reject
 *   "unverified" — no public key configured → can't verify (caller decides)
 */
export function verifyTelnyxSignature(
  rawBody: string,
  signatureB64: string | null,
  timestamp: string | null,
  maxAgeSeconds = 300
): "ok" | "invalid" | "unverified" {
  const publicKeyB64 = process.env.TELNYX_PUBLIC_KEY;
  if (!publicKeyB64) return "unverified";
  if (!signatureB64 || !timestamp) return "invalid";

  // Reject stale timestamps (replay protection). Uses the request timestamp only
  // for age; the signature itself covers timestamp|body so it can't be forged.
  const tsSeconds = Number(timestamp);
  if (!Number.isFinite(tsSeconds)) return "invalid";
  const ageMs = Date.now() - tsSeconds * 1000;
  if (Math.abs(ageMs) > maxAgeSeconds * 1000) return "invalid";

  try {
    const key = createPublicKey({
      key: Buffer.concat([
        // DER prefix for an Ed25519 SubjectPublicKeyInfo + the 32-byte raw key.
        Buffer.from("302a300506032b6570032100", "hex"),
        Buffer.from(publicKeyB64, "base64"),
      ]),
      format: "der",
      type: "spki",
    });
    const signedPayload = Buffer.from(`${timestamp}|${rawBody}`, "utf8");
    const ok = edVerify(null, signedPayload, key, Buffer.from(signatureB64, "base64"));
    return ok ? "ok" : "invalid";
  } catch {
    return "invalid";
  }
}
