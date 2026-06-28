/**
 * Calendar OAuth configuration. ONE multi-tenant Google OAuth app serves every
 * org (single client id/secret); tenants are distinguished by the signed `state`
 * we carry through the consent round-trip, not by separate apps. The redirect
 * URI is a single fixed apex URL so it can be registered once in Google Cloud.
 */

import { apexUrl } from "@/lib/host";

export const GOOGLE_REDIRECT_PATH = "/api/calendar/google/callback";

export function googleRedirectUri(): string {
  return apexUrl(GOOGLE_REDIRECT_PATH);
}

export function googleOAuthConfig() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, redirectUri: googleRedirectUri() };
}

export function googleOAuthConfigured(): boolean {
  return googleOAuthConfig() !== null;
}

/**
 * Scopes: read calendars for free/busy, write events for booking, and the
 * account email (to label the connection). `calendar.events` + `calendar.readonly`
 * cover create/delete and freebusy; userinfo.email names the connected account.
 */
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
];
