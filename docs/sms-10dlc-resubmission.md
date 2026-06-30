# A2P 10DLC resubmission — fixing MNO_REJECTED (806)

**Campaign:** QDXone · TCR `C0ZU6C1` · Telnyx `4b30019f-14a3-d8a2-435a-b766e16b1439`
**Rejection (806):** CTA missing a compliant opt-in path, HELP, STOP, message-
frequency, "msg & data rates may apply", and a privacy-policy link.

## What changed in the product (so the CTA is now verifiable)

- The opt-in checkbox disclosure now states **all** required elements (sender +
  purpose, **message frequency**, **msg & data rates may apply**, **STOP/HELP**)
  and links to **Terms** and **Privacy Policy** right at the checkbox.
- The **Privacy Policy** now has a dedicated **"Text messages (SMS)"** section
  (§5) that explicitly states **mobile opt-in data is never shared or sold to
  third parties for marketing** — the language carriers look for.
  → https://qdx.one/privacy
- Deploy these before resubmitting so reviewers see them live.

## Paste these into the Telnyx/TCR campaign

**Call-to-action / message flow (how end users opt in):**
> End users opt in on the online job application hosted by QDX. On the
> application form (an employer's page, e.g. `https://{employer}.qdx.one/apply/…`),
> the applicant checks an **unchecked-by-default** box labeled "Text me about this
> application (optional)." The inline disclosure at the box reads: "{Employer}
> (via QDX) may text you about this application — your assessment link and status
> updates. Message frequency varies. Msg & data rates may apply. Reply STOP to opt
> out, HELP for help." and links to the Terms (https://qdx.one/terms) and Privacy
> Policy (https://qdx.one/privacy). Consent is optional and not required to apply
> or to be hired. Only applicants who check the box are texted.

**Sample messages** (these are the actual templates we send):
> 1. "Sam, finish your Joe's Pizza application (via QDX) with a quick 5-minute
>    assessment: https://qdx.one/a/abc123 (valid 72h). Reply STOP to opt out, HELP
>    for help."
> 2. "Joe's Pizza (via QDX): you've moved forward on your application — we'll be in
>    touch about next steps. Reply STOP to opt out."

**Message frequency:** Varies — typically 1–5 messages per application.

**Opt-in type:** Web form, single opt-in. Not shared with third parties.

**HELP reply:**
> "QDX (for {Employer}): for help email help@qdx.one. Msg & data rates may apply.
> Reply STOP to unsubscribe."

**STOP reply:**
> "You're unsubscribed and won't receive more texts from {Employer}/QDX. Reply
> HELP for help."

**Privacy policy URL:** https://qdx.one/privacy  (see §5 "Text messages (SMS)")
**Terms URL:** https://qdx.one/terms
**Message & data rates disclosure:** "Msg & data rates may apply." (in the CTA and every message)

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
