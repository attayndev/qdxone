/**
 * Cross-org activity metrics for the super-admin console. Beta-scale: each figure
 * is one lightweight column scan aggregated in memory (swap for RPC/materialized
 * counts if org/application volume ever gets large). Service-role.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";

export interface OrgActivity {
  postings: number;
  applicants: number;
  assessments: number; // completed candidate assessments
  lastActivityAt: string | null; // most recent application submitted_at
}

const empty = (): OrgActivity => ({ postings: 0, applicants: 0, assessments: 0, lastActivityAt: null });

export async function orgActivityMap(): Promise<Map<string, OrgActivity>> {
  const supa = adminClient();
  const [posts, apps, sess] = await Promise.all([
    supa.from("job_postings").select("org_id"),
    supa.from("applications").select("org_id, submitted_at"),
    supa
      .from("assessment_sessions")
      .select("org_id, status, subject_type")
      .eq("subject_type", "candidate")
      .eq("status", "complete"),
  ]);

  const map = new Map<string, OrgActivity>();
  const at = (id: string) => {
    let a = map.get(id);
    if (!a) {
      a = empty();
      map.set(id, a);
    }
    return a;
  };

  for (const r of (posts.data as { org_id: string }[] | null) ?? []) at(r.org_id).postings++;
  for (const r of (apps.data as { org_id: string; submitted_at: string }[] | null) ?? []) {
    const a = at(r.org_id);
    a.applicants++;
    if (!a.lastActivityAt || r.submitted_at > a.lastActivityAt) a.lastActivityAt = r.submitted_at;
  }
  for (const r of (sess.data as { org_id: string }[] | null) ?? []) at(r.org_id).assessments++;

  return map;
}

/** Same shape for one org (detail page) — reuses the map then narrows. */
export async function orgActivity(orgId: string): Promise<OrgActivity> {
  return (await orgActivityMap()).get(orgId) ?? empty();
}
