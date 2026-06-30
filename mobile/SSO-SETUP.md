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

Go to **https://console.cloud.google.com** and sign in.

1. **Pick/create a project.** Top-left project dropdown → *New Project* → name it
   `QDX` → *Create* → make sure it's selected. (Or reuse an existing one.)
2. **OAuth consent screen.** Left hamburger menu → *APIs & Services* → *OAuth
   consent screen*.
   - User type: **External** → *Create*.
   - App name: `QDX`. User support email: pick yours. Developer contact email:
     enter yours. → *Save and Continue*.
   - *Scopes* screen: don't add any → *Save and Continue*.
   - *Test users*: either add the operator emails that will sign in, **or** after
     finishing click *Publish app* → *Confirm* so anyone can. (Email/profile
     scopes need no Google verification, so publishing is instant.)
3. **Create the OAuth client.** *APIs & Services* → *Credentials* → *+ Create
   Credentials* → *OAuth client ID*.
   - Application type: **Web application**.
   - Name: `QDX Supabase`.
   - Under *Authorized redirect URIs* → *+ Add URI* → paste:
     `https://tctukuzzjxihmqqeoifz.supabase.co/auth/v1/callback`
   - *Create*. A dialog shows the **Client ID** and **Client secret** —
     copy both (you'll paste them into Supabase in Step 3).

You do **not** need iOS/Android OAuth clients or SHA-1 — the app authenticates
through Supabase's web client.

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
