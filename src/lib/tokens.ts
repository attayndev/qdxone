import { randomBytes } from "node:crypto";

/**
 * Generate a URL-safe, hard-to-guess token. 18 random bytes → ~24 base64url
 * chars, effectively unguessable. Used for job-posting public tokens,
 * application resume tokens, and assessment access tokens.
 */
export function generateToken(): string {
  return randomBytes(18).toString("base64url");
}
