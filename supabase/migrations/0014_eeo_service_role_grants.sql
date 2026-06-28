-- ─────────────────────────────────────────────────────────────────────
-- Ensure the service role can reach the locked `eeo` schema.
--
-- The `eeo` schema (0003) revoked access from anon/authenticated but never
-- explicitly granted the service role. Combined with the schema not being in
-- the API's exposed-schemas list, every eeoAdmin() read/write was failing
-- (PGRST106) and EEO self-IDs were silently dropped. Exposing the schema is a
-- dashboard setting (Project Settings → API → Exposed schemas → add `eeo`);
-- this migration covers the SQL half so service-role access works once exposed.
--
-- Still service-role-ONLY: anon/authenticated remain revoked, RLS stays on with
-- no policies, so demographic rows never reach a browser key. Idempotent.
-- ─────────────────────────────────────────────────────────────────────

grant usage on schema eeo to service_role;
grant all privileges on all tables in schema eeo to service_role;
alter default privileges in schema eeo grant all on tables to service_role;

-- Belt-and-suspenders: keep app roles out regardless of any future default grant.
revoke all on schema eeo from anon, authenticated;
revoke all on all tables in schema eeo from anon, authenticated;
