"use server";

import { redirect } from "next/navigation";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import {
  createBillingPortalUrlForOrg,
  createCheckoutSessionForOrg,
} from "@/lib/billing";
import { effectiveTier } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";

export async function openBillingPortal() {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const url = await createBillingPortalUrlForOrg({
    orgId: org.id,
    orgSlug: org.slug,
  });
  redirect(url);
}

export async function startCheckoutForCurrentOrg() {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);

  // Tier + cycle derive from the org (location count → Solo/Operator). Enterprise
  // is sales-led and never self-checks-out.
  const tier = effectiveTier(org);
  if (tier === "enterprise") throw new Error("Enterprise is set up by our team");

  const supa = await createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user?.email) throw new Error("No email on file");
  const url = await createCheckoutSessionForOrg({
    orgId: org.id,
    orgSlug: org.slug,
    plan: tier,
    cycle: org.billing_cycle ?? "monthly",
    locations: org.location_count,
    email: user.email,
  });
  redirect(url);
}
