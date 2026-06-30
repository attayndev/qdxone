# Operator app — Google & Apple sign-in setup (step by step)

The code is wired (Google = Supabase browser OAuth/PKCE, Apple = native Sign in
with Apple). These console steps connect it. Do them in order — Supabase needs
values from the first two.

**Project values (copy/paste these exactly):**

| Thing | Value |
| --- | --- |
| Apple Bundle ID / App ID | `one.qdx.operator` |
| Supabase OAuth callback | `https://tctukuzzjxihmqqeoifz.supabase.co/auth/v1/callback` |
| App redirect (deep link) | `qdxoperator://auth-callback` |

> Sign-in is **operator-only**: after SSO the app calls `/api/mobile/me` and
> signs the user back out unless their email already belongs to an operator
> (org member). So the Google/Apple email must match an existing operator.

---

## STEP 1 — Google Cloud Console  (→ Client ID + Secret)

**Reuse the existing Calendar OAuth client** — no need to create a new one. It's a
Web client already in this Google project:

- Client ID: `946223476350-anc66odrgp801svgbv9va6i9rl6hnp0t.apps.googleusercontent.com`
- Secret: already stored as the `GOOGLE_CALENDAR_CLIENT_SECRET` Wrangler secret
  (and visible in the Google console on the client's page).

Go to **https://console.cloud.google.com** → *APIs & Services* → *Credentials* →
open that OAuth client (the one ending `…rl6hnp0t`):

1. Under *Authorized redirect URIs* → *+ Add URI* → paste:
   `https://tctukuzzjxihmqqeoifz.supabase.co/auth/v1/callback`
2. *Save*. (One web client can serve both Calendar and Supabase sign-in.)
3. Note the **Client ID** (above) and **Client secret** (shown on this page) —
   you'll paste them into Supabase in Step 3.

You do **not** need iOS/Android OAuth clients or SHA-1 — the app authenticates
through this web client via the browser flow.

> Only if that client is ever unavailable: create a new one via *+ Create
> Credentials → OAuth client ID → Web application*, add the same redirect URI,
> and (first time in the project) fill the *OAuth consent screen* — External,
> app name `QDX`, your support/developer emails, no extra scopes, then *Publish*.

---

## STEP 2 — Apple Developer  (→ enable Sign in with Apple)

Go to **https://developer.apple.com/account** (needs the $99/yr membership).

1. *Certificates, Identifiers & Profiles* → **Identifiers**.
2. **If `one.qdx.operator` is already listed** (EAS may have created it on an iOS
   build): click it, tick **Sign in with Apple** in the capability list →
   *Save*. Done.
3. **If it's not there**, register it: click the blue **＋** next to Identifiers →
   *App IDs* → *Continue* → type *App* → *Continue*.
   - Description: `QDX Operator`.
   - Bundle ID: select **Explicit** → enter `one.qdx.operator`.
   - In *Capabilities*, tick **Sign in with Apple**.
   - *Continue* → *Register*.

That's all Apple needs for native sign-in. (The app already ships the entitlement
via `usesAppleSignIn` + the `expo-apple-authentication` plugin.)

---

## STEP 3 — Supabase Dashboard  (consumes Steps 1 & 2)

Go to **https://supabase.com/dashboard**, open project **`tctukuzzjxihmqqeoifz`**.

1. **Google provider.** *Authentication* → *Providers* (a.k.a. *Sign In / Up*) →
   **Google** → toggle **Enable**.
   - *Client ID*: paste the Web Client ID from Step 1.
   - *Client Secret*: paste the secret from Step 1.
   - *Save*.
2. **Apple provider.** Same *Providers* list → **Apple** → toggle **Enable**.
   - In *Client IDs* (a.k.a. *Authorized Client IDs*), add: `one.qdx.operator`.
   - Leave the *Secret Key* / *Services ID* blank — only needed for web Apple
     OAuth, not the native flow. → *Save*.
3. **Redirect allow-list.** *Authentication* → *URL Configuration* → *Redirect
   URLs* → *Add URL* → paste `qdxoperator://auth-callback` → *Save*. (This lets
   the Google browser hop return into the app.)

---

## STEP 4 — Test (needs a Dev Build, not Expo Go)

Google's browser flow and Apple's native sheet require a real build:

```bash
cd mobile
eas build --profile development --platform ios     # or android (Google only)
npx expo start --dev-client
```

On the sign-in screen:
- **Continue with Google** opens the browser, you pick your account, it returns
  to the app.
- **Continue with Apple** (iOS only) shows the native sheet.

Either lands you in the tabs if your email is an operator, or bounces back with
"This account isn't set up as an operator…" otherwise.

## Notes
- App Store rule 4.8 requires Sign in with Apple when Google is offered on iOS —
  both are present, so we're compliant.
- The web app still uses email only; web SSO + phone (SMS OTP) are a separate
  backlog item.
