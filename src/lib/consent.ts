// TCPA consent for transactional candidate SMS (assessment links / status).
// Versioned + rendered so the stored proof is the exact language shown.
//
// Pure (no server-only deps) so the client application form can render the same
// disclosure string it stores.

export const SMS_CONSENT_VERSION = "tcpa-v2";

/**
 * The operative disclosure shown inline at the consent checkbox AND stored as
 * the proof. Carries all the CTIA / A2P 10DLC CTA elements as plain text:
 * sender + purpose, message frequency, msg/data rates, and STOP/HELP. The
 * Terms + Privacy links are rendered next to it at the checkbox (see the
 * application form) — together they make the opt-in CTA carrier-compliant.
 */
export function smsConsentDisclosure(orgName: string): string {
  return `${orgName} (via QDX) may text you about this application — your assessment link and status updates. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help.`;
}
