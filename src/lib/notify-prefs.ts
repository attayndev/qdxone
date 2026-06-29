/**
 * Pure, client-safe notification-preference types + helpers — NO server
 * imports, so client components (the settings form) can use DEFAULT_EMAIL /
 * wantsEmail without dragging server-only modules into the bundle. The server
 * dispatch lives in lib/operator-notify.ts and imports from here.
 */

export type ChannelPref = { email?: boolean; sms?: boolean };
export type NotifyEvent = "new_application" | "assessment_done" | "strong";

export type NotifyPrefs = {
  new_application?: ChannelPref;
  assessment_done?: ChannelPref;
  strong?: ChannelPref;
  digest?: boolean;
};

/** Email defaults when a member hasn't chosen: quiet on raw applications, notify
 *  on screened candidates and strong fits. */
export const DEFAULT_EMAIL: Record<NotifyEvent, boolean> = {
  new_application: false,
  assessment_done: true,
  strong: true,
};

/** Text is more intrusive, so it's opt-in: every event defaults to off. */
export const DEFAULT_SMS: Record<NotifyEvent, boolean> = {
  new_application: false,
  assessment_done: false,
  strong: false,
};

export function wantsEmail(
  prefs: NotifyPrefs | null | undefined,
  event: NotifyEvent
): boolean {
  const p = prefs?.[event];
  return p && typeof p.email === "boolean" ? p.email : DEFAULT_EMAIL[event];
}

export function wantsSms(
  prefs: NotifyPrefs | null | undefined,
  event: NotifyEvent
): boolean {
  const p = prefs?.[event];
  return p && typeof p.sms === "boolean" ? p.sms : DEFAULT_SMS[event];
}
