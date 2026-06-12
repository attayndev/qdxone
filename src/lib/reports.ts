import { adminClient } from "@/lib/supabase/admin";
import { orgCandidateTiers } from "@/lib/assessment/session";
import type { OverallFit } from "@/lib/assessment/scoring";

export type OrgReport = {
  funnel: { applied: number; assessmentSent: number; assessmentComplete: number; decided: number };
  completionRate: number | null; // complete / sent
  tierCounts: Record<OverallFit, number>;
  byRole: { role: string; count: number }[];
};

const SENT = new Set(["assessment_sent", "assessment_complete", "decision_made"]);
const DONE = new Set(["assessment_complete", "decision_made"]);

export async function computeOrgReport(orgId: string): Promise<OrgReport> {
  const supa = adminClient();
  const { data: appsData } = await supa
    .from("applications")
    .select("id, status, positions")
    .eq("org_id", orgId);
  const apps = appsData ?? [];

  const applied = apps.length;
  const assessmentSent = apps.filter((a) => SENT.has(a.status)).length;
  const assessmentComplete = apps.filter((a) => DONE.has(a.status)).length;
  const decided = apps.filter((a) => a.status === "decision_made").length;

  const roleMap = new Map<string, number>();
  for (const a of apps) {
    const role = a.positions?.[0] ?? "—";
    roleMap.set(role, (roleMap.get(role) ?? 0) + 1);
  }

  const tiers = await orgCandidateTiers(orgId);
  const tierCounts: Record<OverallFit, number> = {
    "Strong fit": 0,
    Consider: 0,
    Caution: 0,
    "Not recommended": 0,
    Incomplete: 0,
  };
  for (const t of tiers.values()) tierCounts[t] = (tierCounts[t] ?? 0) + 1;

  return {
    funnel: { applied, assessmentSent, assessmentComplete, decided },
    completionRate: assessmentSent ? assessmentComplete / assessmentSent : null,
    tierCounts,
    byRole: [...roleMap.entries()]
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count),
  };
}
