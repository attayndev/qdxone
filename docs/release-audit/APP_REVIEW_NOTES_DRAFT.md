# App Review Notes — QDX Operator (draft)

Paste into App Store Connect "App Review Information → Notes" and Play Console
"App access". Do NOT put real credentials in the repo — the app needs none for review (see below).

---

## What QDXone is
QDXone is a hiring platform for restaurants. Restaurant operators post jobs, applicants apply and take a short assessment on their phone, and the operator gets a scored, ranked shortlist. **QDX Operator** is the companion app for those operators (business users) to review candidates, see assessment scores, invite candidates to interview, and record hiring decisions on the go. It is a native client for the QDXone SaaS at https://qdx.one.

## Accounts
Operator accounts are created on the **web** (qdx.one) — via self-serve signup or a team invite. The **app is sign-in only** (email one-time code, or Sign in with Apple / Google for existing operators). There is no paid tier or purchase in the app; billing (if any) happens on the web. The app is **free**.

## How to review — no credentials needed
On the sign-in screen, tap **"Just exploring? Try the demo →"**. This signs you into a **demo organization** ("Broadway Scoops") preloaded with **anonymized** sample candidates and assessments (no real personal data). From there you can exercise the full app:

1. **Candidates list** — browse, use the filter chips (Active / To review / Strong fit / Decided) and search.
2. **Candidate detail** — tap a candidate to see the scored assessment report (fit, strengths, flags) and their application.
3. **Invite to interview** — from a candidate, send an interview invite (demo).
4. **Record a decision** — advance or decline a candidate.
5. **Interviews tab** — see scheduled interviews.
6. **Account screen** (top-right "Account") — Privacy Policy, Terms, and **Delete account** (opens the deletion page).

Everything in the demo is scrubbed sample data; no real applicant PII is exposed.

## Sign in with Apple
Offered alongside Google + email code, per guideline 4.8. First sign-in with a new Apple ID that is not an existing operator will show a "not an operator" message and sign out — that's expected (operators are provisioned on the web).

## Account deletion
- **In app:** Account → Delete account → opens https://qdx.one/account/delete (deletion is processed server-side).
- **Server:** a `DELETE /api/mobile/account` endpoint deletes the operator's account + personal data. Org-owned hiring records belong to the employer (data controller) and are retained per the Privacy Policy.

## Payments
None. No in-app purchases, subscriptions, or purchase links. The app provides access to a business SaaS whose accounts are managed on the web (guideline 3.1.3 business).

## Permissions
Only **push notifications** (to alert operators when a candidate applies or finishes an assessment). No camera, location, contacts, microphone, or tracking.

## Links
- Privacy Policy: https://qdx.one/privacy
- Terms: https://qdx.one/terms
- Account deletion: https://qdx.one/account/delete
- Support / review questions: support@qdx.one

## If you must test a real operator account (optional)
Not required — the demo covers everything. If needed, enter reviewer credentials during submission (do not store them here):
- Email: `<REVIEWER_TEST_EMAIL>` (email one-time code login)
- Note: passwordless; a code is emailed — provide an inbox the reviewer can access, or use the demo login above instead.
