# Operator app — Google & Apple sign-in setup

The code is wired (browser OAuth for Google, native Sign in with Apple). These
console steps connect it to the providers. Concrete values for this project:

| Thing | Value |
| --- | --- |
| Bundle ID / App ID | `one.qdx.operator` |
| Supabase project | `tctukuzzjxihmqqeoifz` |
| Supabase OAuth callback | `https://tctukuzzjxihmqqeoifz.supabase.co/auth/v1/callback` |
| App redirect (deep link) | `qdxoperator://auth-callback` |

> Sign-in is **operator-only**: after SSO the app calls `/api/mobile/me` and
> signs the user back out unless their email is already an org member. So the
> Google/Apple email must match an existing operator account. (New operators
> still sign up on the web.)

## 1. Google (browser OAuth via Supabase)

**Google Cloud Console** → APIs & Services:
1. **OAuth consent screen** → External → fill app name/support email → save.
2. **Credentials → Create credentials → OAuth client ID → Web application.**
   - Authorized redirect URI:
     `https://tctukuzzjxihmqqeoifz.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client secret**.

**Supabase Dashboard** → Authentication → Providers → **Google**:
3. Enable, paste the Web Client ID + secret, save.

That's all Google needs — we don't use a native Google client, so no iOS/Android
client IDs or SHA-1 fingerprints.

## 2. Apple (native Sign in with Apple)

**Apple Developer** → Certificates, Identifiers & Profiles:
1. Under **Identifiers**, open App ID `one.qdx.operator` (EAS creates it on first
   iOS build if it doesn't exist yet) and enable the **Sign in with Apple**
   capability. The app already declares `usesAppleSignIn` + the
   `expo-apple-authentication` plugin, so the entitlement ships in the build.

**Supabase Dashboard** → Authentication → Providers → **Apple**:
2. Enable it, and under **Client IDs** add `one.qdx.operator` (lets Supabase
   accept the native identity token whose audience is our bundle ID).
   - For *native* sign-in that's enough. The Services ID + secret key fields are
     only needed if you also add Apple sign-in on the web later
     (https://supabase.com/docs/guides/auth/social-login/auth-apple).

## 3. Supabase redirect allow-list (for the Google browser hop)

**Supabase Dashboard** → Authentication → **URL Configuration** →
**Redirect URLs** → add:
```
qdxoperator://auth-callback
```

## 4. Test (needs a Dev Build — not Expo Go)

Google's browser flow and Apple's native sheet both require a real build:
```bash
cd mobile
eas build --profile development --platform ios     # or android (Google only)
npx expo start --dev-client
```
On the sign-in screen: **Continue with Google** opens the browser and returns to
the app; **Continue with Apple** (iOS only) shows the native sheet. Both should
land you in the tabs if your email is an operator, or bounce you back with the
"not set up as an operator" message otherwise.

## Notes
- Apple's App Store rule 4.8 requires Sign in with Apple when another social
  login (Google) is offered on iOS — both are present, so we're compliant.
- The web app still uses email only; rounding out web SSO + phone OTP is a
  separate backlog item.
