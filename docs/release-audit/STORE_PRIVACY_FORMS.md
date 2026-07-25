# Store Privacy Forms — QDX Operator (draft answers)

Fill-in answers for **App Store Connect → App Privacy** and **Play Console →
App content**, derived from the release-audit data inventory
(RELEASE_AUDIT_FINAL.md). Both stores get the same story because it's the same
app.

---

## The inventory (what the app actually collects)

| Data | How it's collected | Notes |
|---|---|---|
| Email address | Sign-in (email one-time code, or Apple/Google SSO) | Account identity; required to use the app |
| Name | Only from Apple/Google SSO profile | Optional — email-code sign-in never collects it |
| User ID | Supabase account UUID | Created with the account |
| Device ID | Expo push token | Only if the user enables notifications |

**Not collected — everything else.** No location, contacts, photos, camera,
mic, health, financial, messages, browsing/search history. **No analytics,
crash-reporting, or ads SDKs at all.** No tracking of any kind.

**Candidate/applicant data is NOT declared.** The app *displays* the
employer's business records fetched from the QDXone API — it does not collect
anything about candidates *from the operator's device*. Both forms ask only
about data collected from the app's users (the operators).

---

## Apple — App Store Connect → App Privacy

**Privacy Policy URL:** `https://qdx.one/privacy`

**"Do you or your third-party partners collect data from this app?"** → **Yes**

Declare exactly these four data types (everything else: not collected):

| Data type | Category | Linked to identity? | Used for tracking? | Purposes |
|---|---|---|---|---|
| Email Address | Contact Info | Yes | No | App Functionality |
| Name | Contact Info | Yes | No | App Functionality |
| User ID | Identifiers | Yes | No | App Functionality |
| Device ID | Identifiers | Yes | No | App Functionality |

- Every "purpose" screen: check **App Functionality** only (nothing for
  analytics, advertising, personalization, or product improvement).
- **Tracking section:** No data is used to track users across apps/websites.
  (No ATT prompt exists in the app — consistent.)
- Resulting privacy "nutrition label": *Data Linked to You: Contact Info,
  Identifiers* — nothing else. Matches a sign-in-only business tool.

---

## Google Play — Play Console → App content → Data safety

**Overview questions**
- Collect or share required data types? → **Yes**
- All user data encrypted in transit? → **Yes** (HTTPS only, ATS intact)
- Provide a way to request data deletion? → **Yes** →
  deletion URL: `https://qdx.one/account/delete`

**Data types declared**

| Play category | Type | Collected | Shared | Optional? | Purposes |
|---|---|---|---|---|---|
| Personal info | Email address | Yes | No | No (required) | App functionality, Account management |
| Personal info | Name | Yes | No | Yes (SSO only) | App functionality, Account management |
| Personal info | User IDs | Yes | No | No (required) | App functionality, Account management |
| Device or other IDs | Device or other IDs | Yes | No | Yes (push opt-in) | App functionality |

- **Shared: No for everything.** Supabase/Cloudflare are service providers
  processing on our instructions — Play's definition of "sharing" excludes
  service providers, so nothing is "shared with third parties."
- Data deleted when the account is deleted; not processed ephemerally.

**Other App content declarations (same page)**
- Privacy policy: `https://qdx.one/privacy`
- Ads: **No ads** (no ads SDKs)
- App access: **All or some functionality is restricted** → add instructions:
  "Sign-in screen → tap 'Just exploring? Try the demo →' for a one-tap demo
  login (no credentials needed)" — reuse APP_REVIEW_NOTES_DRAFT.md text.
- Content rating questionnaire: category **Utility/Productivity/Business**;
  answer No to all content questions → expect **Everyone / PEGI 3**.
- Target audience: **18 and over** only (business tool; do not tick any
  under-18 age bands, which keeps Families policy out of scope).
- News app: No · COVID-19 app: No · Government app: No ·
  Financial features: None · Health features: None.

---

## Play release path (when review actually happens)

1. **Internal testing — no Google review, live in minutes.** Create the app
   record, hand-upload the first AAB (build `596ff33d`) to *Internal testing*,
   add your own Google account as a tester. This also triggers the
   **pre-launch report** (verifies targetSdk 35 + 16 KB pages — the two
   assumed-good items from the audit).
2. **Fill the App content declarations** (everything above) — required before
   any reviewed track.
3. **Production ("submit for review")** — promote the same AAB to Production
   and *Send for review* from Publishing overview. Google's review for a
   first-time app typically takes **1–7 days**.

Caveat to confirm: if the Play developer account was registered as a
**personal** account (post-Nov-2023 rules), production access first requires a
closed test with 12 testers running 14 continuous days. **Organization**
accounts are exempt. If the account is under Attayn Group LLC (like Apple),
there's no forced wait.
