import { adminClient } from "@/lib/supabase/admin";
import { getOrgLocations } from "@/lib/locations";
import { orgCandidateTiers } from "@/lib/assessment/session";
import type { OverallFit } from "@/lib/assessment/scoring";

export type OrgReport = {
  funnel: { applied: number; assessmentSent: number; assessmentComplete: number; decided: number };
  completionRate: number | null; // complete / sent
  tierCounts: Record<OverallFit, number>;
  byRole: { role: string; count: number }[];
  // Per-location rollup (Operator+). Empty/one entry for single-location orgs.
  byLocation: { location: string; applied: number; complete: number }[];
};

const SENT = new Set(["assessment_sent", "assessment_complete", "decision_made"]);
const DONE = new Set(["assessment_complete", "decision_made"]);

export async function computeOrgReport(orgId: string): Promise<OrgReport> {
  const supa = adminClient();
  const { data: appsData } = await supa
    .from("applications")
    .select("id, status, positions, location_id")
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

  // Per-location rollup.
  const locations = await getOrgLocations(orgId);
  const locName = new Map(locations.map((l) => [l.id, l.name]));
  const locStats = new Map<string, { applied: number; complete: number }>();
  for (const a of apps) {
    const key = a.location_id ?? "—";
    const cur = locStats.get(key) ?? { applied: 0, complete: 0 };
    cur.applied += 1;
    if (DONE.has(a.status)) cur.complete += 1;
    locStats.set(key, cur);
  }
  const byLocation = [...locStats.entries()]
    .map(([id, s]) => ({ location: locName.get(id) ?? "Unassigned", ...s }))
    .sort((a, b) => b.applied - a.applied);

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
    byLocation,
  };
}
