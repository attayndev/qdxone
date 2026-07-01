/**
 * Scored candidate list for the mobile app. Reuses the web's scoreAssessment so
 * fit is computed identically — no duplicated scoring logic, just the read
 * boilerplate. Service-role reads, scoped to the org resolved from the JWT.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import type { OverallFit } from "@/lib/assessment/scoring";
import { fitByApplication } from "@/lib/assessment/fit";

export interface MobileCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  submittedAt: string;
  fit: OverallFit | null;
  decision: string | null;
}

export async function listScoredCandidates(orgId: string): Promise<MobileCandidate[]> {
  const supa = adminClient();
  const { data: apps } = await supa
    .from("applications")
    .select("id, first_name, last_name, email, positions, status, submitted_at, decision")
    .eq("org_id", orgId)
    .order("submitted_at", { ascending: false })
    .limit(200);
  const applications =
    (apps as {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      positions: string[] | null;
      status: string;
      submitted_at: string;
      decision: string | null;
    }[] | null) ?? [];

  const fit = await fitByApplication(orgId);

  return applications.map((a) => ({
    id: a.id,
    firstName: a.first_name,
    lastName: a.last_name,
    email: a.email,
    role: a.positions?.[0] ?? "—",
    status: a.status,
    submittedAt: a.submitted_at,
    fit: fit.get(a.id) ?? null,
    decision: a.decision,
  }));
}
