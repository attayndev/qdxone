"use server";

import { adminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupa } from "@/lib/supabase/server";
import { orgUrl } from "@/lib/tenancy";

/**
 * DEV ONLY — one-step sign-in for local iteration. Disabled in production.
 * Ensures a confirmed user exists, ensures the given org exists and that the
 * user owns it, sets a temp password, and signs in (sets the session cookie).
 * No email / OTP / PKCE — entirely self-contained so it can't half-work.
 */
export async function devSignIn(
  formData: FormData
): Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "Dev sign-in is disabled in production." };
  }
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const slug =
    String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase() || "16handlesnewcity";
  if (!email) return { ok: false, error: "Enter an email." };

  const admin = adminClient();

  // 1. Ensure a confirmed user; capture id.
  let userId: string | null = null;
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (link.data?.user) {
    userId = link.data.user.id;
  } else {
    const created = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    userId = created.data.user?.id ?? null;
  }
  if (!userId) return { ok: false, error: "Could not resolve a user." };

  // 2. Set a temp password so we can sign in without email.
  const tempPassword = `dev-pw-${userId}`;
  await admin.auth.admin.updateUserById(userId, {
    password: tempPassword,
    email_confirm: true,
  });

  // 3. Ensure the org exists.
  let { data: org } = await admin
    .from("organizations")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) {
    const trialEnds = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const ins = await admin
      .from("organizations")
      .insert({
        slug,
        name: slug,
        branding: {},
        plan: "solo",
        billing_cycle: "monthly",
        trial_ends_at: trialEnds,
        status: "trialing",
      })
      .select("id, slug")
      .single();
    org = ins.data;
  }
  if (!org) return { ok: false, error: "Could not ensure org." };

  // 4. Ensure the user owns it.
  await admin
    .from("org_members")
    .upsert({ org_id: org.id, user_id: userId, role: "owner" });

  // 5. Sign in (sets the session cookie scoped to .lvh.me / .qdx.one).
  const supa = await createServerSupa();
  const { error } = await supa.auth.signInWithPassword({
    email,
    password: tempPassword,
  });
  if (error) {
    console.error("[devSignIn] password sign-in failed:", error.message);
    return { ok: false, error: "Sign-in failed: " + error.message };
  }

  // Return the URL; the client navigates (a full reload carries the cookie
  // and works across subdomains, unlike a server-action redirect).
  return { ok: true, redirectTo: orgUrl(org.slug, "/admin") };
}
