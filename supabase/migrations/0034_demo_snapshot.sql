-- Frozen, anonymized demo dataset. Captured once from live (PII-scrubbed);
-- the nightly reset + the demo-bar Restore button reload THIS exact data, so the
-- demo is identical every night and independent of the live source changing.
create table if not exists demo_snapshot (
  id uuid primary key default gen_random_uuid(),
  captured_at timestamptz not null default now(),
  data jsonb not null
);
alter table demo_snapshot enable row level security; -- service-role only; no policy = deny others
