"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow, requireMembership, orgUrl } from "@/lib/tenancy";
import { effectiveTier, planLimits, TIER_LABEL } from "@/lib/plan";

export type TeamResult = { ok: true } | { ok: false; error: string };

const InviteSchema = z.object({ email: z.string().email().max(200) });

/**
 * Find an existing auth user by email, or create one (confirmed, no password —
 * they sign in via magic link). Note: listUsers is paginated; perPage 1000 is
 * fine for beta scale but would need a proper lookup at volume.
 */
async function findOrCreateUser(email: string): Promise<string | null> {
  const admin = adminClient();
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = list?.users?.find(
    (u) => (u.email ?? "").toLowerCase() === email.toLowerCase()
  );
  if (found) return found.id;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error || !data?.user) {
    console.error("createUser failed", error);
    return null;
  }
  return data.user.id;
}

/** Best-effort invite email (Resend REST). No-op when unconfigured. */
async function sendInviteEmail(to: string, orgName: string, url: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `You've been added to ${orgName} on QDX`,
        html: `<p>You've been added to <strong>${orgName}</strong>'s hiring team on QDX.</p><p>Sign in here: <a href="${url}">${url}</a></p>`,
      }),
    });
  } catch (e) {
    console.error("invite email failed", e);
  }
}

/** Invite a manager (added as an admin). Enforces the plan's seat limit. */
export async function inviteMember(formData: FormData): Promise<TeamResult> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);

  const parsed = InviteSchema.safeParse({
    email: (formData.get("email") ?? "").toString().trim().toLowerCase(),
  });
  if (!parsed.success) return { ok: false, error: "Enter a valid email." };
  const email = parsed.data.email;

  const supa = adminClient();
  const tier = effectiveTier(org);
  const limits = planLimits(tier, org.location_count);
  const { count } = await supa
    .from("org_members")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id);
  if (limits.seats !== null && (count ?? 0) >= limits.seats) {
    return {
      ok: false,
      error: `Your ${TIER_LABEL[tier]} plan includes ${limits.seats} logins. Add a location or upgrade for more.`,
    };
  }

  const userId = await findOrCreateUser(email);
  if (!userId) return { ok: false, error: "Could not add that person. Try again." };

  const { data: existing } = await supa
    .from("org_members")
    .select("user_id")
    .eq("org_id", org.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return { ok: false, error: "That person is already on your team." };

  const { error } = await supa
    .from("org_members")
    .insert({ org_id: org.id, user_id: userId, role: "admin" });
  if (error) {
    console.error("add member failed", error);
    return { ok: false, error: "Could not add them. Try again." };
  }

  await supa.from("audit_log").insert({
    org_id: org.id,
    actor_user_id: m.user_id,
    action: "member.invited",
    subject_type: "user",
    subject_id: userId,
    meta: { email },
  });

  await sendInviteEmail(email, org.name, orgUrl(org.slug, "/admin/login"));
  revalidatePath("/admin/team");
  return { ok: true };
}

/** Remove a member. The owner can't be removed. */
export async function removeMember(userId: string): Promise<TeamResult> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);
  const supa = adminClient();

  const { data: target } = await supa
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!target) return { ok: false, error: "Not on this team." };
  if (target.role === "owner") {
    return { ok: false, error: "You can't remove the owner." };
  }

  await supa
    .from("org_members")
    .delete()
    .eq("org_id", org.id)
    .eq("user_id", userId);
  await supa.from("audit_log").insert({
    org_id: org.id,
    actor_user_id: m.user_id,
    action: "member.removed",
    subject_type: "user",
    subject_id: userId,
  });
  revalidatePath("/admin/team");
  return { ok: true };
}
