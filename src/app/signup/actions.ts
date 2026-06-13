"use server";

import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupa } from "@/lib/supabase/server";
import { ROOT_DOMAIN, isReservedSubdomain, orgUrl } from "@/lib/tenancy";
import { apexUrl } from "@/lib/host";
import type { BillingCycle } from "@/lib/supabase/types";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

const SignupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  slug: z
    .string()
    .min(2)
    .max(30)
    .regex(SLUG_RE, "Letters, numbers, and dashes only"),
  // No plan picker: every org starts as Solo (1 location). Operator pricing
  // emerges automatically once they add a 2nd location (tier derives from
  // location count — see src/lib/plan.ts).
  cycle: z.enum(["monthly", "annual"]).default("monthly"),
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
 * Self-serve signup. Creates the organization on the chosen plan in
 * 'trialing' status with a 30-day trial. Sends a magic link to the email;
 * on callback the user is added as the org owner and lands in the admin
 * dashboard at the org's subdomain. Stripe Checkout (card captured for the
 * trial) is kicked off in parallel when configured.
 */
export async function signup(
  formData: FormData
): Promise<SignupResult> {
  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    slug: (formData.get("slug") ?? "").toString().toLowerCase().trim(),
    cycle: formData.get("cycle") ?? "monthly",
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

  // Everyone gets a 30-day trial with a card captured at signup. New orgs start
  // as Solo (1 location); tier/quota/seats are derived from plan + location
  // count at read time (src/lib/plan), so nothing numeric is stored here.
  const trialEnds = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  const billingCycle: BillingCycle = v.cycle;

  const { data: org, error: oerr } = await supa
    .from("organizations")
    .insert({
      slug: v.slug,
      name: v.name,
      branding: {},
      plan: "solo",
      billing_cycle: billingCycle,
      trial_ends_at: trialEnds,
      status: "trialing",
    })
    .select("id, slug")
    .single();
  if (oerr || !org) {
    console.error(oerr);
    return { ok: false, error: "Could not create organization. Try again." };
  }

  await supa.from("audit_events").insert({
    org_id: org.id,
    kind: "org.created",
    meta: {
      plan: "solo",
      requested_by: v.email,
    },
  });

  // Send the magic link. The email confirmation completes signup by
  // adding the user as the org owner (handled in /auth/callback, which
  // reads the org id from the user's auth metadata — never a URL param).
  // The callback lands on the APEX: a subdomain /auth/callback gets
  // zone-redirected by the proxy, and the session cookie is scoped to
  // `.qdx.one`, so the apex callback sets it once and it carries to the
  // operator's subdomain admin.
  const callbackUrl = apexUrl(
    `/auth/callback?next=${encodeURIComponent("/admin")}`
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

  // Kick off Stripe Checkout to capture the card for the 30-day trial.
  // Skipped automatically in dev when Stripe isn't configured.
  let checkoutUrl: string | undefined;
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const { createCheckoutSessionForOrg } = await import("@/lib/billing");
      checkoutUrl = await createCheckoutSessionForOrg({
        orgId: org.id,
        orgSlug: org.slug,
        plan: "solo",
        cycle: v.cycle,
        locations: 1,
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
