/**
 * Expo push registration for the operator app. On a signed-in launch we ask for
 * permission, mint the device's Expo push token, and hand it to the API
 * (`/api/mobile/push/register`) which stores it against the org. The server
 * sends through the Expo Push Service when a candidate applies or finishes the
 * assessment; tapping the notification deep-links to that candidate.
 *
 * Push only works in a Dev Build / store build — Expo Go (SDK 53+) can't get a
 * push token. We no-op gracefully there and when no EAS projectId is set yet.
 */

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { apiSend } from "./api";

// Foreground display behavior — show the banner even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/**
 * Request permission + register this device's token with the server. Safe to
 * call on every signed-in launch — it's idempotent (the server upserts) and
 * silently no-ops on simulators, in Expo Go, or before `eas init` sets a
 * projectId. Returns true if a token was registered.
 */
export async function registerForPush(): Promise<boolean> {
  if (!Device.isDevice) return false; // no push on simulators/emulators

  const id = projectId();
  if (!id) return false; // run `eas init` to populate extra.eas.projectId

  // Android needs a channel before the permission prompt will show.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return false;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    await apiSend("POST", "/api/mobile/push/register", {
      token,
      platform: Platform.OS,
    });
    return true;
  } catch {
    return false; // token mint / network failure — try again next launch
  }
}

/** Subscribe to notification taps; calls back with the candidate id, if any. */
export function onNotificationTap(handler: (applicationId: string) => void) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as { applicationId?: string };
    if (data?.applicationId) handler(data.applicationId);
  });
}
