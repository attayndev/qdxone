-- 0019_pending_owner_email.sql
-- Harden signup owner-promotion: bind the intended owner to a server-set email
-- so a malicious user can't self-promote to owner of an ownerless org by setting
-- their own user_metadata.signup_org_id. Set at signup, verified + cleared on the
-- auth callback.
alter table organizations add column if not exists pending_owner_email text;
