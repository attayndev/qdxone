# QDX Operator — Mobile Release Audit (Final)

**Date:** 2026-07-11 · **App:** QDX Operator (`one.qdx.operator`) · **Stack:** Expo SDK 56 / RN, Supabase auth, Next.js API at qdx.one, Cloudflare hosting.

---

## Determination: **CONDITIONAL GO — ready after the listed manual submission steps**

The app is well-built, safe, and store-eligible. The two hard blockers found (account deletion, in-app privacy links) have been **resolved in code**. What remains is not engineering risk — it's a **new mobile build** carrying those changes plus store-console form-filling and two build-artifact verifications that can only be done on the compiled binaries.

---

## Executive Summary

QDX Operator is a genuine native operator tool (candidate list/filter/search, native scored report, interview invites, decisions, push) for a multi-tenant restaurant-hiring SaaS — **not** a web wrapper. Backend security is strong (a prior full review confirmed tenant isolation, RLS on every tenant table, no cross-tenant leaks, no server secrets in the client). Payments are clean — it's a **free** app with no IAP and no purchase UI, correctly fitting Apple's business-SaaS model (3.1.3). Config points only at production; no residue, no secrets, no staging leaks in the client.

The gaps were mobile-store-specific: no account-deletion path and no in-app legal links. Both are now addressed, and a one-tap **demo login** was added so App Review can inspect representative (scrubbed) data with zero credentials.

## Release Blockers

| # | Blocker | Store | Status |
|---|---|---|---|
| 1 | No account-deletion path | Apple 5.1.1(v) + Google | **RESOLVED (code)** — public `/account/delete` page (Google URL) + in-app "Delete account" (opens it) + a server `DELETE /api/mobile/account` endpoint as insurance. Ships in the next build. |
| 2 | No in-app Privacy/Terms link | Google (Apple risk) | **RESOLVED (code)** — Account screen links to `/privacy` and `/terms`. Ships in the next build. |

No remaining P0/P1 that block submission **once the new build is uploaded** and the manual steps below are done.

## Security Assessment
*Tested:* client secrets (grep of src/app.json/eas.json — none; only the publishable anon key), token storage, deep-link/OAuth callback, permissions, ATS, config leakage, and — from the prior backend review — tenant isolation, RLS, mobile-API authz, and secrets handling.
*Passed:* no server secrets in the client; PKCE OAuth with an idempotent, non-privileged callback (custom-scheme interception is mitigated); ATS not weakened; no cleartext; every `/api/mobile/**` endpoint checks the JWT + org membership.
*Open (not a submission blocker):* **P2 — Supabase session (access+refresh JWT) is stored in plaintext AsyncStorage** (`mobile/src/lib/supabase.ts`), and Android `allowBackup` defaults to true. Remediation: an `expo-secure-store` adapter with Android chunking (SecureStore's ~2KB/key limit) + `allowBackup=false`. Recommended before a wide launch; **not** a store rejection. Deferred here per "no risky auth changes immediately pre-release."
*Not a blanket "no vulnerabilities":* no live SAST/DAST/pen-test/dependency-CVE scanner was run; findings are limited to source inspection + targeted tests.

## Apple Readiness
- **Build reqs / archive validation / privacy manifest (`PrivacyInfo.xcprivacy`):** Expo SDK 56 handles these at build; **unable to verify from source** — confirm in the Xcode Organizer archive.
- **Sign in with Apple (4.8):** ✅ wired (`usesAppleSignIn`, expo-apple-authentication, button gated on availability).
- **Permissions/purpose strings:** ✅ minimal — only notifications requested; no camera/location/etc. usage strings (none used).
- **Account deletion (5.1.1(v)):** ✅ resolved (in-app link + server endpoint).
- **Payments (3.1.3):** ✅ no IAP; business-SaaS access purchased on the web — compliant, no purchase UI in the app.
- **Reviewer access:** ✅ one-tap "Try the demo" → scrubbed demo org (see App Review notes).
- **Unresolved Apple risk:** the link-out deletion relies on the app reading as sign-in-only; the server `DELETE` endpoint is built so wiring a true in-app delete is ~15 min if a reviewer objects.

## Google Readiness
- **Account deletion:** ✅ in-app path + **public web URL** `https://qdx.one/account/delete` for the Data-safety form.
- **Privacy link in-app:** ✅ Account screen.
- **Data Safety form:** ⚠️ **must be filled** to match: collects account **email** (auth) + **push token** (device id) + **name** (Apple SSO); **no** tracking/ads/analytics SDKs; candidate data is *viewed* (employer's business data), not collected from the device.
- **Target SDK ≥ 35 & 16 KB page size:** ⚠️ **unable to verify from source** (managed workflow) — confirm on the production AAB / Play pre-launch report. Expo 56 is expected to satisfy both.
- **Reviewer access:** ✅ demo login.

## Code Quality
Mobile `src` is clean: **no** TODO/FIXME/HACK, `console.*`, `any` casts, mock/lorem/placeholder data, hardcoded IDs, or localhost/staging URLs (verified by two independent audit passes). Errors are sanitized (no raw stacks to users); the few empty catches are intentional + commented. **Added:** Account screen, demo-login, deletion endpoint + page. No refactors — deliberately avoided pre-release.

## Performance
Not re-measured in this pass (no evidence of a regression; the app is a thin native client over paginated APIs). The one backend perf note from the prior session — list fits recomputed per request — is acceptable at current scale.

## Files Changed (this audit)
- `src/app/api/mobile/account/route.ts` — server-side account deletion (auth-gated).
- `src/app/api/mobile/demo-session/route.ts` — public demo magic-link token for the app.
- `src/app/account/delete/page.tsx` — public web deletion page (Google URL).
- `mobile/src/app/account.tsx` — Account screen (Privacy/Terms/Delete/Sign out).
- `mobile/src/app/sign-in.tsx` — "Try the demo" one-tap login.
- `mobile/src/app/(tabs)/index.tsx` — header → Account screen.

## Commands Executed
- `tsc` (web + mobile): ✅ clean. `next build`: ✅ compiled. `wrangler deploy`: ✅ (version c6fa3e99).
- Live: demo-session POST → **200** + token_hash; anon `verifyOtp(token_hash)` → **session as demo@qdx.one**; `/account/delete` → **200**; `DELETE /api/mobile/account` (no auth) → **401**.

## Manual Actions Still Required (cannot be done from the repo)
1. **Cut a new mobile build** (`eas build --profile preview` per the standing preview-only rule) that includes the Account screen, demo login, and deletion/privacy links, then submit that build.
2. **Fill `mobile/eas.json` submit IDs** (`REPLACE_WITH_*` Apple ID / ASC App ID / Team ID; Team ID is `6W5G6FZQSX`) and provide `play-service-account.json` (keep untracked).
3. **App Store Connect:** App Privacy answers (email, name, device id; no tracking); reviewer notes (below); screenshots; privacy URL `qdx.one/privacy`.
4. **Play Console:** Data safety form (as above); account-deletion URL `qdx.one/account/delete`; store listing + content rating; run the **pre-launch report** to confirm targetSdk 35 + 16 KB pages.
5. **Verify on the built artifacts:** `PrivacyInfo.xcprivacy` present (iOS archive); `targetSdkVersion ≥ 35` and 16 KB ELF alignment (Android AAB).

## Remaining Risks
- Token-at-rest (AsyncStorage) + `allowBackup` — P2, fix before wide launch.
- The two Android build-artifact items are **assumed-good but unverified** from source.
- Apple's deletion enforcement on a sign-in-only app is inconsistent; the server delete endpoint is the ready mitigation.
- No live dependency-CVE / secret-history scanner or on-device test lab was run; recommend a Play pre-launch report + a TestFlight round before public release.
