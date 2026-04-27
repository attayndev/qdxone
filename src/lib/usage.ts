import { adminClient } from "./supabase/admin";
import type { TestTypeKey } from "./supabase/types";

/**
 * Record a billable test (one completed questionnaire = one test).
 * Decides overage vs. included against the org's monthly_quota for
 * the given test type. Phase 3 will additionally report overage usage
 * to Stripe; until then this just persists the event.
 */
export async function recordUsage(args: {
  orgId: string;
  typeKey: TestTypeKey;
  applicantId: string | null;
}): Promise<{ isOverage: boolean }> {
  const supa = adminClient();
  const periodStart = startOfMonthISO();

  // Look up quota
  const { data: tt } = await supa
    .from("org_test_types")
    .select("monthly_quota, enabled")
    .eq("org_id", args.orgId)
    .eq("type_key", args.typeKey)
    .maybeSingle();

  const quota = tt?.monthly_quota ?? 0;

  // Count this period's events for this type
  const { count } = await supa
    .from("usage_events")
    .select("*", { count: "exact", head: true })
    .eq("org_id", args.orgId)
    .eq("type_key", args.typeKey)
    .eq("billing_period_start", periodStart);

  const used = count ?? 0;
  const isOverage = used >= quota;

  let reportedToStripe = false;
  if (isOverage && process.env.STRIPE_SECRET_KEY) {
    try {
      const { reportOverageToStripe } = await import("./billing");
      await reportOverageToStripe({
        orgId: args.orgId,
        typeKey: args.typeKey,
      });
      reportedToStripe = true;
    } catch (e) {
      console.error("stripe overage report failed", e);
    }
  }

  await supa.from("usage_events").insert({
    org_id: args.orgId,
    type_key: args.typeKey,
    applicant_id: args.applicantId,
    billing_period_start: periodStart,
    is_overage: isOverage,
    reported_to_stripe: reportedToStripe,
  });

  return { isOverage };
}

export async function getUsageForPeriod(args: {
  orgId: string;
  typeKey: TestTypeKey;
  periodStart?: string;
}): Promise<{ used: number; quota: number; overage: number }> {
  const supa = adminClient();
  const periodStart = args.periodStart ?? startOfMonthISO();

  const [{ data: tt }, { count: usedCount }, { count: overageCount }] =
    await Promise.all([
      supa
        .from("org_test_types")
        .select("monthly_quota")
        .eq("org_id", args.orgId)
        .eq("type_key", args.typeKey)
        .maybeSingle(),
      supa
        .from("usage_events")
        .select("*", { count: "exact", head: true })
        .eq("org_id", args.orgId)
        .eq("type_key", args.typeKey)
        .eq("billing_period_start", periodStart),
      supa
        .from("usage_events")
        .select("*", { count: "exact", head: true })
        .eq("org_id", args.orgId)
        .eq("type_key", args.typeKey)
        .eq("billing_period_start", periodStart)
        .eq("is_overage", true),
    ]);

  const quota = tt?.monthly_quota ?? 0;
  return {
    used: usedCount ?? 0,
    quota,
    overage: overageCount ?? 0,
  };
}

function startOfMonthISO(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}
