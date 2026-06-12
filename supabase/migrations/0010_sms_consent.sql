-- ─────────────────────────────────────────────────────────────────────
-- TCPA SMS consent (informational/transactional texts: assessment links,
-- application status). Prior express consent suffices; a checkbox is a valid
-- mechanism. We store the timestamped proof directly on the application:
--   • sms_consent            — did the candidate opt in (unchecked default)
--   • sms_consent_at         — when they consented
--   • sms_consent_disclosure — the EXACT disclosure language they saw
-- Channel = SMS; the number is applications.phone; the sender is the org
-- (org_id). Candidate SMS is gated on sms_consent at send time.
--
-- (A dedicated append-only ConsentRecord table + STOP opt-out tracking comes
-- with the skills epic, when re-contact scoping needs it. Twilio enforces STOP
-- at the carrier level regardless.)
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

alter table applications
  add column if not exists sms_consent boolean not null default false,
  add column if not exists sms_consent_at timestamptz,
  add column if not exists sms_consent_disclosure text;
