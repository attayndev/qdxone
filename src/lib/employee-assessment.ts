import "server-only";
import { adminClient } from "./supabase/admin";

/**
 * Where each employee stands on the assessment (for the "benchmark everyone"
 * gap scan). An employee is:
 *   'assessed' — their application has a COMPLETE assessment session
 *   'sent'     — a session exists but isn't complete yet
 *   'none'     — no session (needs sending) — or no linked application
 */
export type AssessStatus = "assessed" | "sent" | "none";

export async function assessmentStatusByEmployee(
  orgId: string
): Promise<Map<string, AssessStatus>> {
  const supa = adminClient();
  const [{ data: emps }, { data: sessions }] = await Promise.all([
    supa
      .from("employees")
      .select("id, application_id")
      .eq("org_id", orgId)
      .eq("employment_status", "employed"),
    supa
      .from("assessment_sessions")
      .select("application_id, status")
      .eq("org_id", orgId)
      .eq("subject_type", "candidate"),
  ]);

  const byApp = new Map<string, "complete" | "other">();
  for (const s of (sessions as { application_id: string | null; status: string }[] | null) ?? []) {
    if (!s.application_id) continue;
    if (s.status === "complete") byApp.set(s.application_id, "complete");
    else if (!byApp.has(s.application_id)) byApp.set(s.application_id, "other");
  }

  const out = new Map<string, AssessStatus>();
  for (const e of (emps as { id: string; application_id: string | null }[] | null) ?? []) {
    if (!e.application_id) {
      out.set(e.id, "none");
      continue;
    }
    const st = byApp.get(e.application_id);
    out.set(e.id, st === "complete" ? "assessed" : st ? "sent" : "none");
  }
  return out;
}

/** Employees who haven't been sent the assessment yet (the gap to close). */
export async function assessmentGapCount(orgId: string): Promise<number> {
  const status = await assessmentStatusByEmployee(orgId);
  let n = 0;
  for (const s of status.values()) if (s === "none") n++;
  return n;
}
