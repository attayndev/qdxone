# QDX Operator app — push, builds & store submission

Everything in the codebase is wired. The steps below need your developer
accounts + a physical device, so they run on your machine, not in CI.

## 0. One-time prerequisites

- **Apple Developer Program** — $99/yr (`developer.apple.com`). Required for
  TestFlight + the App Store, and for APNs push credentials.
- **Google Play Developer** — $25 one-time (`play.google.com/console`).
- **Expo account** — free (`expo.dev`), then `npm i -g eas-cli && eas login`.

## 1. Link the EAS project (sets the push `projectId`)

```bash
cd mobile
eas init          # creates/links the EAS project for slug "qdx-operator"
```

This writes `extra.eas.projectId` into `app.json`. **Until this runs,
`registerForPush()` no-ops** (the client guards on a missing projectId), so push
is silently off in local Expo Go — that's expected.

## 2. Apply the DB migration

`supabase/migrations/0016_push_tokens.sql` adds the `push_tokens` table the
register endpoint writes to. Apply it the same way the other migrations ship
(Supabase). Until it exists, `/api/mobile/push/register` returns a 400 and the
app just won't receive push — nothing else breaks.

## 3. Test push in a Dev Build (not Expo Go)

Expo Go (SDK 53+) can't mint a push token, so make a dev build once:

```bash
eas build --profile development --platform ios     # or android
# install the build on your device, then:
npx expo start --dev-client
```

Sign in → grant the notification prompt → the device token registers against
your org. Trigger a real event (submit a test application to one of your
postings, or finish an assessment) and the push should arrive. Tapping it deep
-links to that candidate. You can also test a raw send with the Expo push tool:
`https://expo.dev/notifications`.

### Push credentials
- **iOS (APNs):** `eas build` offers to generate the APNs key automatically —
  accept it. Nothing to upload by hand.
- **Android (FCM):** create a Firebase project, download the service account
  JSON, and run `eas credentials` → Android → "Google Service Account" →
  upload it (this is what lets Expo deliver to FCM). One-time.

## 4. Production builds

```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

## 5. Submit to the stores

Fill the placeholders in `eas.json` → `submit.production` first:
- `appleId` — your Apple account email
- `ascAppId` — the App Store Connect app's numeric ID (create the app shell in
  App Store Connect first)
- `appleTeamId` — from `developer.apple.com/account` → Membership
- Android `serviceAccountKeyPath` — path to the Play service-account JSON

```bash
eas submit --profile production --platform ios       # → TestFlight → App Store
eas submit --profile production --platform android   # → Play internal track
```

### App Store gotcha
Apple requires a privacy "nutrition label" + that you describe the push usage.
We collect: account email, candidate data (operator's own business data). No
tracking/ads. If we later add Google sign-in on iOS, App Store rule 4.8 also
requires an equivalent privacy-respecting option (Apple sign-in) — tracked in
the auth backlog.

## Notes
- API base: the app calls `EXPO_PUBLIC_API_URL` (defaults to `https://qdx.one`).
  Set it in `mobile/.env` for builds that should hit a different host.
- Push respects no per-event prefs yet — installing the app + granting
  permission is the opt-in, and both "new applicant" and "assessment complete"
  events push to every registered device. A future `push` channel in
  `notify_prefs` can gate this if it proves noisy.
