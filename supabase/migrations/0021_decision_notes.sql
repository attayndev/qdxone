-- Split the single decision "reason / notes" field into two:
--   decision_reason  — a short, pickable reason (already exists, now dropdown-backed)
--   decision_notes   — free-form notes (new)
-- The editable reason list lives per-org in branding.decision_reasons (a
-- string[]), resolved in code with sensible defaults; no schema needed for it.

alter table applications
  add column if not exists decision_notes text;
