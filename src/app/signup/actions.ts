"use server";

import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupa } from "@/lib/supabase/server";
import { ROOT_DOMAIN, isReservedSubdomain, orgUrl } from "@/lib/tenancy";
import type {
  BillingCycle,
  PlanTier,
} from "@/lib/supabase/types";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

const SignupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  slug: z
    .string()
    .min(2)
    .max(30)
    .regex(SLUG_RE, "Letters, numbers, and dashes only"),
  plan: z.enum(["starter", "growth"]),
  cycle: z.enum(["annual", "monthly"]),
});

export type SignupResult =
  | {
      ok: true;
      orgUrl: string;
      magicLinkSent: boolean;
      checkoutUrl?: string;
    }
  | { ok: false; error: string; field?: string };

/**
 * Self-serve signup. Creates the organization in 'trial' state on
 * annual plans (7-day trial) or 'starter'/'growth' on monthly (no trial,
 * Stripe billing required). Sends a magic link to the email; on
 * callback the user is added as the org owner and lands in the admin
 * dashboard at the org's subdomain.
 *
 * Phase 3 will hand off to Stripe Checkout for monthly plans.
 */
export async function signup(
  formData: FormData
): Promise<SignupResult> {
  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    slug: (formData.get("slug") ?? "").toString().toLowerCase().trim(),
    plan: formData.get("plan"),
    cycle: formData.get("cycle"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      field: parsed.error.issues[0]?.path?.[0]?.toString(),
    };
  }
  const v = parsed.data;
  if (isReservedSubdomain(v.slug)) {
    return { ok: false, error: "That subdomain is reserved.", field: "slug" };
  }

  const supa = adminClient();

  // Slug uniqueness
  const { data: existing } = await supa
    .from("organizations")
    .select("id")
    .eq("slug", v.slug)
    .maybeSingle();
  if (existing) {
    return { ok: false, error: "That subdomain is taken.", field: "slug" };
  }

  const isAnnual = v.cycle === "annual";
  const trialEnds = isAnnual
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const initialPlan: PlanTier = isAnnual ? "trial" : v.plan;
  const billingCycle: BillingCycle = v.cycle;
  const monthlyQuota = v.plan === "growth" ? 25 : 10;
  const overageCents = isAnnual ? 300 : 400;

  const { data: org, error: oerr } = await supa
    .from("organizations")
    .insert({
      slug: v.slug,
      name: v.name,
      branding: {},
      plan: initialPlan,
      billing_cycle: billingCycle,
      trial_ends_at: trialEnds,
      status: "active",
    })
    .select("id, slug")
    .single();
  if (oerr || !org) {
    console.error(oerr);
    return { ok: false, error: "Could not create organization. Try again." };
  }

  // Seed the questionnaire test type for this org with the chosen quota.
  await supa.from("org_test_types").insert({
    org_id: org.id,
    type_key: "questionnaire",
    monthly_quota: monthlyQuota,
    overage_unit_cents: overageCents,
    enabled: true,
  });

  await supa.from("audit_events").insert({
    org_id: org.id,
    kind: "org.created",
    meta: {
      plan: v.plan,
      cycle: v.cycle,
      requested_by: v.email,
    },
  });

  // Send the magic link. The email confirmation completes signup by
  // adding the user as the org owner (handled in /auth/callback).
  // We carry the new org's id in the redirect's `org` param so the
  // callback can promote them.
  const callbackUrl = orgUrl(
    org.slug,
    `/auth/callback?signup=${encodeURIComponent(org.id)}&next=${encodeURIComponent("/admin")}`
  );

  // Send via the regular auth client so Supabase emails the OTP itself.
  const authClient = await createServerSupa();
  const { error: linkErr } = await authClient.auth.signInWithOtp({
    email: v.email,
    options: {
      emailRedirectTo: callbackUrl,
      shouldCreateUser: true,
      data: { signup_org_id: org.id },
    },
  });
  if (linkErr) {
    console.error("magic link error", linkErr);
    return {
      ok: true,
      orgUrl: orgUrl(org.slug, "/admin/login"),
      magicLinkSent: false,
    };
  }

  // For monthly signups, also kick off Stripe Checkout in parallel —
  // they'll be billed before they ever land on the admin dashboard.
  let checkoutUrl: string | undefined;
  if (!isAnnual && process.env.STRIPE_SECRET_KEY) {
    try {
      const { createCheckoutSessionForOrg } = await import("@/lib/billing");
      checkoutUrl = await createCheckoutSessionForOrg({
        orgId: org.id,
        orgSlug: org.slug,
        plan: v.plan,
        cycle: v.cycle,
        email: v.email,
      });
    } catch (e) {
      console.error("checkout session failed", e);
    }
  }

  void ROOT_DOMAIN;
  return {
    ok: true,
    orgUrl: orgUrl(org.slug, "/admin"),
    magicLinkSent: true,
    checkoutUrl,
  };
}
