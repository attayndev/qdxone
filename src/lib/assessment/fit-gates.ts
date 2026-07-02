/**
 * Server glue for custom-question gates: given a map of application -> fit,
 * cap each by the applicant's gated answers. Fetches the org's gated questions
 * once (no-op if the org has none), then the relevant answers. Kept in its own
 * module so both fit.ts and session.ts can use it without an import cycle.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import type { OverallFit } from "@/lib/assessment/scoring";
import type { CustomQuestion } from "@/lib/supabase/types";
import {
  gatedQuestions,
  evaluateCustomGates,
  fitCapFromGates,
  applyFitCap,
} from "@/lib/custom-question-gates";

export async function applyGatesToFits(
  orgId: string,
  fits: Map<string, OverallFit>
): Promise<Map<string, OverallFit>> {
  if (fits.size === 0) return fits;
  const supa = adminClient();

  const { data: org } = await supa
    .from("organizations")
    .select("branding")
    .eq("id", orgId)
    .maybeSingle();
  const questions =
    (org?.branding as { application_config?: { custom_questions?: CustomQuestion[] } } | null)
      ?.application_config?.custom_questions ?? [];
  const gated = gatedQuestions(questions);
  if (gated.length === 0) return fits; // common case — nothing to do

  const { data: apps } = await supa
    .from("applications")
    .select("id, custom_answers")
    .in("id", [...fits.keys()]);
  const answersByApp = new Map(
    ((apps as { id: string; custom_answers: unknown }[] | null) ?? []).map((a) => [
      a.id,
      (Array.isArray(a.custom_answers) ? a.custom_answers : []) as { id: string; value: string }[],
    ])
  );

  const out = new Map<string, OverallFit>();
  for (const [appId, fit] of fits) {
    const findings = evaluateCustomGates(gated, answersByApp.get(appId) ?? []);
    out.set(appId, applyFitCap(fit, fitCapFromGates(findings)));
  }
  return out;
}
