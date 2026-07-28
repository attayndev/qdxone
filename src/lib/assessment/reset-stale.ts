import "server-only";
import { adminClient } from "@/lib/supabase/admin";

export const STALE_ASSESSMENT_DAYS = 3;

/**
 * Reset assessment sends that got no response within STALE_ASSESSMENT_DAYS — an
 * invite that was never opened (no started_at) and never completed. We delete the
 * dead session and revert the application to 'new', so the person resurfaces as
 * "needs assessment": the send is unblocked (a manager can re-send, and the bulk
 * team-send picks them up again). Partially-completed sessions are left untouched
 * so a candidate's in-progress answers are never discarded. Sends no email itself.
 * Runs across all orgs from the nightly cron.
 */
export async function resetStaleAssessments(): Promise<{ reset: number }> {
  const supa = adminClient();
  const cutoff = new Date(Date.now() - STALE_ASSESSMENT_DAYS * 86_400_000).toISOString();

  const { data: stale } = await supa
    .from("assessment_sessions")
    .select("id, application_id")
    .neq("status", "complete")
    .is("started_at", null)
    .lt("created_at", cutoff);
  const rows = (stale as { id: string; application_id: string | null }[] | null) ?? [];
  if (rows.length === 0) return { reset: 0 };

  await supa
    .from("assessment_sessions")
    .delete()
    .in(
      "id",
      rows.map((r) => r.id)
    );

  // Revert only sends still marked as such — never touch decided/completed apps.
  const appIds = [...new Set(rows.map((r) => r.application_id).filter((x): x is string => !!x))];
  if (appIds.length) {
    await supa
      .from("applications")
      .update({ status: "new" } as never)
      .in("id", appIds)
      .eq("status", "assessment_sent");
  }
  return { reset: rows.length };
}
