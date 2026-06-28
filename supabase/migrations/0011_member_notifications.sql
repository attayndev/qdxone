-- ─────────────────────────────────────────────────────────────────────
-- Per-member operator notification preferences (each owner/manager tunes
-- their own noise) + a phone for the SMS channel (Phase 3).
--
--   notify_prefs (jsonb) — per-event channel switches, e.g.
--     { "new_application": {"email": false},
--       "assessment_done": {"email": true},
--       "strong":          {"email": true},
--       "digest":          false }
--   Missing keys fall back to app defaults (see lib/operator-notify.ts):
--     quiet on raw applications, notify on screened/strong candidates.
--
--   phone — the operator's mobile, used only when the SMS channel is on.
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

alter table org_members
  add column if not exists notify_prefs jsonb not null default '{}'::jsonb,
  add column if not exists phone text;
