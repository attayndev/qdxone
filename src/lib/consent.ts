// TCPA consent for transactional candidate SMS (assessment links / status).
// Versioned + rendered so the stored proof is the exact language shown.
//
// Pure (no server-only deps) so the client application form can render the same
// disclosure string it stores.

export const SMS_CONSENT_VERSION = "tcpa-v1";

/**
 * The operative disclosure shown inline at the consent checkbox AND stored as
 * the proof. Names the sender (restaurant via QDX), states msg/data rates, and
 * the STOP opt-out — the material terms must be conspicuous, not hover-only.
 */
export function smsConsentDisclosure(orgName: string): string {
  return `${orgName} (via QDX) may text you about this application. Msg & data rates may apply. Reply STOP to opt out, HELP for help.`;
}
