import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import { encrypt, decrypt } from "./crypto";

const KEY = randomBytes(32);

describe("token crypto (AES-256-GCM)", () => {
  it("round-trips a token", () => {
    const token = "ya29.a0Af_xyz-REFRESH.token_value";
    expect(decrypt(encrypt(token, KEY), KEY)).toBe(token);
  });

  it("produces a fresh IV each time (ciphertext differs, plaintext matches)", () => {
    const a = encrypt("same", KEY);
    const b = encrypt("same", KEY);
    expect(a).not.toBe(b);
    expect(decrypt(a, KEY)).toBe("same");
    expect(decrypt(b, KEY)).toBe("same");
  });

  it("rejects a tampered ciphertext (GCM auth tag)", () => {
    const sealed = encrypt("secret", KEY);
    const parts = sealed.split(".");
    // Flip a byte in the ciphertext segment.
    const ct = Buffer.from(parts[3], "base64url");
    ct[0] ^= 0x01;
    parts[3] = ct.toString("base64url");
    expect(() => decrypt(parts.join("."), KEY)).toThrow();
  });

  it("fails to decrypt with the wrong key", () => {
    const sealed = encrypt("secret", KEY);
    expect(() => decrypt(sealed, randomBytes(32))).toThrow();
  });

  it("rejects malformed payloads", () => {
    expect(() => decrypt("not-a-valid-payload", KEY)).toThrow(/Malformed/);
  });
});
