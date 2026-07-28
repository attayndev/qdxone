-- ─────────────────────────────────────────────────────────────────────
-- Backfill employees.email from the linked application. Earlier imported-hire
-- records were created without an email, which broke CSV-import dedup (it
-- couldn't tell an already-employed person from a new one → duplicates).
-- ensureEmployeeForHire now sets email; this fixes existing rows. Idempotent.
-- ─────────────────────────────────────────────────────────────────────

update employees e
set email = a.email
from applications a
where e.application_id = a.id
  and e.email is null
  and a.email is not null;
