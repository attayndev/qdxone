/**
 * Google Calendar provider — a thin raw-`fetch` client (adapted from CloudMeet,
 * MIT — see THIRD_PARTY_NOTICES.md) implementing CalendarProvider plus the OAuth
 * authorization-code helpers. No SDK; all token I/O is server-side and tokens are
 * never returned to the browser.
 *
 * Server-only (uses the OAuth client secret) — import from route handlers /
 * server actions, never from a client component.
 */

import "server-only";
import {
  type BusyPeriod,
  type BusyPeriodRequest,
  type CalendarEventResult,
  type CalendarProvider,
  type CreateCalendarEventRequest,
  type RefreshConnectionResult,
} from "./provider";
import { GOOGLE_SCOPES, googleOAuthConfig } from "./config";

const OAUTH_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const OAUTH_TOKEN = "https://oauth2.googleapis.com/token";
const OAUTH_REVOKE = "https://oauth2.googleapis.com/revoke";
const USERINFO = "https://www.googleapis.com/oauth2/v2/userinfo";
const CAL_API = "https://www.googleapis.com/calendar/v3";

function requireConfig() {
  const cfg = googleOAuthConfig();
  if (!cfg) throw new Error("Google Calendar OAuth is not configured");
  return cfg;
}

async function asError(res: Response, ctx: string): Promise<never> {
  const body = await res.text().catch(() => "");
  throw new Error(`Google ${ctx} failed (${res.status}): ${body.slice(0, 500)}`);
}

// ── OAuth ──────────────────────────────────────────────────────────────────

/** Build the consent URL. `state` is our signed, tenant-binding token. */
export function buildGoogleAuthUrl(state: string): string {
  const { clientId, redirectUri } = requireConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline", // get a refresh token
    prompt: "consent", // force refresh-token issuance on re-connect
    include_granted_scopes: "true",
    state,
  });
  return `${OAUTH_AUTH}?${params.toString()}`;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  email: string | null;
}

/** Exchange the authorization code for tokens and resolve the account email. */
export async function exchangeGoogleCode(code: string): Promise<GoogleTokens> {
  const { clientId, clientSecret, redirectUri } = requireConfig();
  const res = await fetch(OAUTH_TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) await asError(res, "token exchange");
  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  const email = await fetchGoogleEmail(json.access_token).catch(() => null);
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: new Date(Date.now() + json.expires_in * 1000),
    email,
  };
}

async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(USERINFO, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { email?: string };
  return json.email ?? null;
}

/** Best-effort token revoke on disconnect (Google ignores already-revoked). */
export async function revokeGoogleToken(token: string): Promise<void> {
  await fetch(`${OAUTH_REVOKE}?token=${encodeURIComponent(token)}`, {
    method: "POST",
  }).catch(() => {});
}

// ── CalendarProvider ─────────────────────────────────────────────────────────

class GoogleCalendarProvider implements CalendarProvider {
  readonly id = "google" as const;

  async refreshConnection(input: {
    refreshToken: string;
  }): Promise<RefreshConnectionResult> {
    const { clientId, clientSecret } = requireConfig();
    const res = await fetch(OAUTH_TOKEN, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: input.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) await asError(res, "token refresh");
    const json = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token, // Google usually omits on refresh
      expiresAt: new Date(Date.now() + json.expires_in * 1000),
    };
  }

  async getBusyPeriods(input: BusyPeriodRequest): Promise<BusyPeriod[]> {
    const ids = input.calendarIds?.length ? input.calendarIds : ["primary"];
    const res = await fetch(`${CAL_API}/freeBusy`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${input.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        timeMin: input.timeMin.toISOString(),
        timeMax: input.timeMax.toISOString(),
        items: ids.map((id) => ({ id })),
      }),
    });
    if (!res.ok) await asError(res, "freeBusy");
    const json = (await res.json()) as {
      calendars: Record<string, { busy?: { start: string; end: string }[] }>;
    };
    const out: BusyPeriod[] = [];
    for (const cal of Object.values(json.calendars ?? {})) {
      for (const b of cal.busy ?? []) {
        out.push({ start: new Date(b.start), end: new Date(b.end) });
      }
    }
    return out;
  }

  async createEvent(
    input: CreateCalendarEventRequest
  ): Promise<CalendarEventResult> {
    const conference = input.createConference
      ? {
          conferenceData: {
            createRequest: {
              requestId: `qdx-${input.start.getTime()}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        }
      : {};
    const url = new URL(
      `${CAL_API}/calendars/${encodeURIComponent(input.calendarId)}/events`
    );
    if (input.createConference) url.searchParams.set("conferenceDataVersion", "1");
    url.searchParams.set("sendUpdates", "all");
    const res = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${input.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        location: input.location,
        start: { dateTime: input.start.toISOString(), timeZone: input.timezone },
        end: { dateTime: input.end.toISOString(), timeZone: input.timezone },
        attendees: input.attendeeEmails.map((email) => ({ email })),
        ...conference,
      }),
    });
    if (!res.ok) await asError(res, "create event");
    const json = (await res.json()) as {
      id: string;
      htmlLink?: string;
      hangoutLink?: string;
      conferenceData?: { entryPoints?: { uri?: string }[] };
    };
    const conferenceUrl =
      json.hangoutLink ?? json.conferenceData?.entryPoints?.[0]?.uri;
    return { externalEventId: json.id, conferenceUrl, htmlLink: json.htmlLink };
  }

  async deleteEvent(input: {
    accessToken: string;
    calendarId: string;
    externalEventId: string;
  }): Promise<void> {
    const res = await fetch(
      `${CAL_API}/calendars/${encodeURIComponent(
        input.calendarId
      )}/events/${encodeURIComponent(input.externalEventId)}?sendUpdates=all`,
      {
        method: "DELETE",
        headers: { authorization: `Bearer ${input.accessToken}` },
      }
    );
    // 410 = already deleted; treat as success.
    if (!res.ok && res.status !== 404 && res.status !== 410) {
      await asError(res, "delete event");
    }
  }
}

export const googleProvider = new GoogleCalendarProvider();
