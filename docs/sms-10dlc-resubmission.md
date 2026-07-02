# A2P 10DLC resubmission — fixing MNO_REJECTED (861)

**Campaign:** QDXone · Brand `QDXone` · TCR `C0ZU6C1` · Telnyx `4b30019f-14a3-d8a2-435a-b766e16b1439`

**Rejection (861):** CTA must show opt-in path + HELP + STOP + message-frequency +
"msg & data rates may apply" + a privacy-policy link. **AND** the message content
itself must be compliant: the **opt-in/confirmation** message must contain brand
name, HELP, opt-out, message frequency, and fees; the **opt-out** reply must
contain the brand name and say no further messages will be sent; the **HELP**
reply must contain the brand name and a support contact.

The CTA page (https://qdx.one/messaging) already covers the website side. The 861
fixes below are in the **message templates** — every sent/auto-reply message now
carries the brand + all required disclosures.

---

## 1. Auto-responses (set these EXACTLY in the Telnyx messaging profile + the campaign form)

**Opt-in / confirmation** (brand + purpose + frequency + fees + HELP + opt-out):
```
QDXone: You're opted in to hiring texts about your job application. Msg frequency varies (about 1-5 per application). Msg & data rates may apply. Reply HELP for help, STOP to opt out.
```

**Opt-out — keyword STOP** (brand + no-further-messages):
```
QDXone: You're unsubscribed and will receive no more messages. No further texts will be sent to this number.
```

**HELP — keyword HELP** (brand + support contact):
```
QDXone hiring texts. Help: qdxone@attayn.com or https://qdx.one/messaging. Msg frequency varies; msg & data rates may apply. Reply STOP to unsubscribe.
```

### Keywords
- Uses keywords: `Yes`
- Opt-out: `STOP,STOPALL,UNSUBSCRIBE,CANCEL,END,QUIT`
- Help: `HELP,INFO`

---

## 2. Sample messages (the actual message content — must match what's sent)

**First / confirmation message** (mirrors `sendAssessmentLink` in `src/lib/notify.ts` — brand, purpose, frequency, fees, HELP, opt-out):
```
Cameron, finish your 16 Handles New City application (via QDX): https://16handlesnewcity.qdx.one/a/AbC123 (5-min assessment, valid 72h). Msg frequency varies; msg & data rates may apply. Reply HELP for help, STOP to opt out.
```

**Follow-up (interview invite):**
```
16 Handles New City (via QDX): pick an interview time: https://16handlesnewcity.qdx.one/interview/AbC123 Reply STOP to opt out, HELP for help.
```

**Operator alert (a hiring manager who opted in via their notification settings):**
```
16 Handles New City: Cameron Bennett finished the assessment — Strong fit. https://16handlesnewcity.qdx.one/admin/candidates/abc123
```

---

## 3. Call-to-Action / opt-in description (Content details field)

```
QDXone is a hiring platform for restaurants. With the applicant's explicit opt-in, employers send transactional text messages to job applicants about their own application — a link to a short assessment and status updates. This is not marketing.

Applicants opt in by entering their mobile number and checking an unchecked consent checkbox on the restaurant's online job-application form (e.g. https://16handlesnewcity.qdx.one/apply/...). The checkbox reads: "[Restaurant] (via QDX) may text you about this application — your assessment link and status updates. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help." and links to our Terms and Privacy Policy. Consent is optional and not required to apply; it is stored with a timestamp. Hiring managers opt in separately by entering their mobile number and enabling text alerts in their account's notification settings. No message is sent without opt-in. The exact opt-in box and full program terms are published publicly at https://qdx.one/messaging.
```
The quoted checkbox text MUST match the live disclosure (`smsConsentDisclosure`
in `src/lib/consent.ts`, version `tcpa-v2`) — update both together if it changes.

---

## 4. Compliance links
- Opt-in / CTA (message program) page: `https://qdx.one/messaging`
- Privacy Policy (has the "Text messages (SMS)" section, no data sharing): `https://qdx.one/privacy`
- Terms: `https://qdx.one/terms`

---

## Product changes shipped for 861
- `sendAssessmentLink` (the confirmation message) now includes **message frequency
  + "msg & data rates may apply"** in addition to brand, STOP, and HELP.
- The `/messaging` example message mirrors it.
- Opt-out/HELP auto-replies (above) now include the **brand name** and, for HELP,
  a **support contact** — set them in the Telnyx messaging profile before resubmit.
