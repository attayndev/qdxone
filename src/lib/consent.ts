// TCPA consent for transactional candidate SMS (assessment links / status).
// Versioned + rendered so the stored proof is the exact language shown.
//
// Pure (no server-only deps) so the client application form can render the same
// disclosure string it stores.

export const SMS_CONSENT_VERSION = "tcpa-v3";

/**
 * The consent statement body shown at the checkbox AND stored as proof (with
 * the links suffix appended). Carries every CTIA / A2P 10DLC opt-in element:
 * express consent, sender + purpose, msg/data rates, frequency, STOP/HELP,
 * "consent not required", and no-sharing. The Terms + Privacy links are
 * rendered at the end (see the application form); `smsConsentText` reassembles
 * the full plain-text version for the stored proof record.
 *
 * Two intentional adaptations from the generic e-commerce template:
 *  - "(via QDX)" identifies the actual registered sending brand (the platform),
 *    matching the texts themselves and the 10DLC registration.
 *  - "apply for or be considered for a job" replaces "purchasing products or
 *    services" — the accurate parallel for a hiring context (the CTIA clause
 *    means consent isn't a condition of the thing the person came for).
 */
export function smsConsentBody(orgName: string): string {
  return (
    `I give my express consent to receive recurring automated service updates ` +
    `and account notification texts to the phone number provided from ${orgName} ` +
    `(via QDX). Message and data rates may apply. Msg frequency varies. I ` +
    `understand I can opt out by replying 'STOP' to any message, or get more ` +
    `info by replying 'HELP.' Consent is not required to apply for or be ` +
    `considered for a job. My number will not be shared with third parties or ` +
    `affiliates.`
  );
}

/** The trailing sentence rendered with Terms + Privacy as links in the form. */
export const SMS_CONSENT_LINKS_SUFFIX =
  "View our Terms of Service and Privacy Policy.";

/** Full plain-text disclosure stored as the consent proof (body + suffix). */
export function smsConsentText(orgName: string): string {
  return `${smsConsentBody(orgName)} ${SMS_CONSENT_LINKS_SUFFIX}`;
}
