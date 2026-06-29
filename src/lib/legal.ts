/**
 * Single source of truth for the legal docs + acceptance records. Bump
 * TERMS_VERSION whenever /terms or /privacy changes materially; the signup flow
 * stamps the current version into an audit_events `terms.accepted` row so we can
 * prove which version each operator agreed to.
 *
 * NOTE: these documents are plain-language drafts and should be reviewed by
 * counsel before being relied upon.
 */

export const LEGAL_ENTITY = "Attayn Group LLC (DBA QDXone)";
export const LEGAL_SHORT = "QDXone";
export const GOVERNING_STATE = "New York";
export const LEGAL_EMAIL = "qdxone@attayn.com";

/** ISO date; also the human "Effective" date shown on the pages. */
export const TERMS_VERSION = "2026-06-29";
export const TERMS_EFFECTIVE = "June 29, 2026";
