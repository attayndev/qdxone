-- ─────────────────────────────────────────────────────────────────────
-- Platform admins (QDX staff) — a proper DB-backed allow-list for the /super
-- console, replacing the PLATFORM_OWNER_EMAILS env string (which stays only as a
-- bootstrap fallback in code). Seeded by email; `user_id` is linked on the
-- admin's first login (self-healing). A platform admin is NOT an org role and
-- need not belong to any org. Service-role only — the server gate reads it.
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- First admin.
insert into platform_admins (email) values ('yan@attayn.com')
  on conflict (email) do nothing;

alter table platform_admins enable row level security;
-- No policies on purpose: only the service role (the server-side gate) ever
-- touches this table; anon/authenticated clients get nothing.
