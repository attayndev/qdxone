# A2P 10DLC resubmission — fixing MNO_REJECTED (806)

**Campaign:** QDXone · TCR `C0ZU6C1` · Telnyx `4b30019f-14a3-d8a2-435a-b766e16b1439`
**Rejection (806):** CTA missing a compliant opt-in path, HELP, STOP, message-
frequency, "msg & data rates may apply", and a privacy-policy link.

## What changed in the product (so the CTA is now verifiable)

- **NEW public CTA page → https://qdx.one/messaging** — a single, publicly
  reachable URL that shows the exact opt-in box + wording and states all six
  required elements (opt-in path, HELP, STOP, frequency, "msg & data rates may
  apply", privacy). **Use this as the campaign's Call-to-Action / message-flow
  URL** — reviewers can't reach the application form (it's behind an employer's
  posting link), so this page is what makes the CTA verifiable.
- The opt-in checkbox disclosure now states **all** required elements (sender +
  purpose, **message frequency**, **msg & data rates may apply**, **STOP/HELP**)
  and links to **Terms** and **Privacy Policy** right at the checkbox.
- The **Privacy Policy** now has a dedicated **"Text messages (SMS)"** section
  (§5) that explicitly states **mobile opt-in data is never shared or sold to
  third parties for marketing** — the language carriers look for.
  → https://qdx.one/privacy
- Deploy these before resubmitting so reviewers see them live.

## Final answers — conformed to the Telnyx/TCR campaign form

### Content details (one field, two paragraphs)
```
QDXone is a hiring platform for restaurants. With the applicant's explicit opt-in, employers send transactional text messages to job applicants about their own application — for example, a link to a short assessment and status updates. Texts are only sent to applicants who check the SMS opt-in box on the job application. This is not a marketing campaign.

Applicants opt in by entering their mobile number and checking an unchecked consent checkbox on the restaurant's online job-application form (e.g. https://16handlesnewcity.qdx.one/apply/...). The checkbox reads: "[Restaurant] (via QDX) may text you about this application — your assessment link and status updates. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help." and links to our Terms and Privacy Policy. Consent is optional, is not required to apply, and is stored with a timestamp. Hiring managers opt in separately by entering their mobile number and enabling text alerts in their account's notification settings. No message is sent without opt-in. The exact opt-in box and full program terms are published publicly at https://qdx.one/messaging.
```
The quoted checkbox text MUST match the live disclosure (`smsConsentDisclosure`
in `src/lib/consent.ts`, version tcpa-v2) — update both together if it changes.

### Keywords
- Uses keywords: `Yes`
- Opt-out: `STOP,STOPALL,UNSUBSCRIBE,CANCEL,END,QUIT`
- Help: `HELP,INFO`

### Auto-responses
- Opt-in: `You're opted in to QDXone hiring texts. Msg & data rates may apply. Reply STOP to opt out, HELP for help.`
- Opt-out: `You're unsubscribed and won't receive more messages. Reply HELP for help.`
- Help: `QDXone hiring texts. Help: qdxone@attayn.com. Reply STOP to unsubscribe. Msg & data rates may apply.`

### Sample messages
```
Cameron, finish your 16 Handles New City application (via QDX) with a quick 5-minute assessment: https://16handlesnewcity.qdx.one/a/AbC123 (valid 72h). Reply STOP to opt out, HELP for help.
```
```
Cameron, 16 Handles New City would like to interview you — pick a time: https://16handlesnewcity.qdx.one/interview/AbC123 Reply STOP to opt out, HELP for help.
```
```
16 Handles New City: Cameron Bennett finished the assessment — Strong fit. https://16handlesnewcity.qdx.one/admin/candidates/abc123
```

### Compliance links
- `https://qdx.one/privacy`
- `https://qdx.one/terms`
- `https://qdx.one/messaging`  (public opt-in/CTA page — NOT a one-time interview link)

### Campaign & content attributes
- Embedded Link: `Yes` (every sample has a link)
- Embedded Phone Number: `No`
- Number Pooling: `No` (single number, not a pool)
- Age-Gated Content: `No`
- Direct Lending or Loan Arrangement: `No`

### Webhook
- `https://qdx.one/api/telnyx/webhook`  (verified 200; route at `src/app/api/telnyx/webhook/route.ts`)

## Attach to the resubmission
A **screenshot of the application form** showing the opt-in checkbox with the full
disclosure + Terms/Privacy links visible. Reviewers often can't reach the form
(it's behind an employer's posting link), so the screenshot + the public Privacy
Policy URL are what unblocks verification.

## Checklist (all six 806 items)
- [x] Specific mobile opt-in path — application-form checkbox (described above)
- [x] HELP instructions — in disclosure + every message + HELP auto-reply
- [x] STOP instructions — in disclosure + every message + STOP auto-reply
- [x] Message-frequency disclosure — "Message frequency varies"
- [x] "Msg & data rates may apply" — in disclosure + messages
- [x] Privacy-policy link — at the checkbox and as a public URL with an SMS section
