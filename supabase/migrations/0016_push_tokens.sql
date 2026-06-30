-- ─────────────────────────────────────────────────────────────────────
-- Expo push tokens for the operator mobile app. One row per device: the
-- Expo push token (e.g. ExponentPushToken[...]) that the Expo Push Service
-- targets. A user can have several (phone + tablet); a token is globally
-- unique and re-registers (upsert) to its latest user/org on each app launch,
-- so a reused device follows whoever last signed in. Tokens are pruned when
-- Expo reports them as DeviceNotRegistered. Idempotent.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  token text not null unique,
  platform text not null default 'unknown'
    check (platform in ('ios', 'android', 'unknown')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_org_idx on push_tokens (org_id);

alter table push_tokens enable row level security;

-- Members of the org may see/manage that org's device tokens; the mobile API
-- writes via the service role (which bypasses RLS), the same as the rest of
-- the mobile surface.
drop policy if exists push_tokens_member_all on push_tokens;
create policy push_tokens_member_all on push_tokens
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
