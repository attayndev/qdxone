"use server";

import { redirect } from "next/navigation";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import {
  createBillingPortalUrlForOrg,
  createCheckoutSessionForOrg,
} from "@/lib/billing";
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

export async function startCheckoutForCurrentOrg(
  plan: "starter" | "growth"
) {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const supa = await createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user?.email) throw new Error("No email on file");
  const url = await createCheckoutSessionForOrg({
    orgId: org.id,
    orgSlug: org.slug,
    plan,
    email: user.email,
  });
  redirect(url);
}
