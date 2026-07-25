-- Per-posting overrides for the work-history and references application
-- fields. NULL = inherit the org-level default (branding.application_config).
-- Values match the FieldMode type: 'hidden' | 'optional' | 'required'.

alter table job_postings
  add column if not exists work_experience_mode text
    check (work_experience_mode in ('hidden', 'optional', 'required')),
  add column if not exists references_mode text
    check (references_mode in ('hidden', 'optional', 'required'));
