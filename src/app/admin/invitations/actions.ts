"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { generateToken, DEFAULT_TTL_DAYS } from "@/lib/invitations";
import type { InvitationRow } from "@/lib/supabase/types";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";

async function requireSignedIn() {
  const supa = await createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supa, user };
}

const CreateSchema = z.object({
  first_name: z.string().max(80).optional().or(z.literal("")),
  last_name: z.string().max(80).optional().or(z.literal("")),
  email: z.string().email().max(200).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
  send_email: z.coerce.boolean().optional(),
});

export type CreateResult =
  | { ok: true; invitation: InvitationRow; emailed: boolean }
  | { ok: false; error: string };

export async function createInvitation(
  formData: FormData
): Promise<CreateResult> {
  try {
    const { user } = await requireSignedIn();
    const org = await currentOrgOrThrow();
    await requireMembership(org.id);

    const parsed = CreateSchema.safeParse({
      first_name: formData.get("first_name") ?? "",
      last_name: formData.get("last_name") ?? "",
      email: formData.get("email") ?? "",
      phone: formData.get("phone") ?? "",
      notes: formData.get("notes") ?? "",
      send_email: formData.get("send_email") === "on",
    });
    if (!parsed.success) {
      return { ok: false, error: "Some fields were invalid." };
    }
    const v = parsed.data;
    const token = generateToken();
    const expiresAt = new Date(
      Date.now() + DEFAULT_TTL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const supa = adminClient();
    const initialStatus = v.send_email && v.email ? "sent" : "draft";
    const { data, error } = await supa
      .from("invitations")
      .insert({
        org_id: org.id,
        token,
        first_name: v.first_name || null,
        last_name: v.last_name || null,
        email: v.email || null,
        phone: v.phone || null,
        notes: v.notes || null,
        status: initialStatus,
        expires_at: expiresAt,
        sent_at: initialStatus === "sent" ? new Date().toISOString() : null,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error(error);
      return { ok: false, error: "Could not create invitation." };
    }
    await supa.from("audit_events").insert({
      org_id: org.id,
      invitation_id: data.id,
      kind: "invite.created",
    });

    let emailed = false;
    if (v.send_email && v.email) {
      try {
        const { sendInvitationEmail } = await import("@/lib/email");
        await sendInvitationEmail({
          to: v.email,
          firstName: v.first_name || null,
          token,
          orgSlug: org.slug,
          orgName: org.name,
        });
        await supa.from("audit_events").insert({
          org_id: org.id,
          invitation_id: data.id,
          kind: "invite.sent",
          meta: { channel: "email" },
        });
        emailed = true;
      } catch (e) {
        console.error("invite email failed", e);
      }
    }

    revalidatePath("/admin/invitations");
    revalidatePath("/admin");
    return { ok: true, invitation: data as InvitationRow, emailed };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error",
    };
  }
}

export async function expireInvitation(id: string) {
  await requireSignedIn();
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);

  const supa = adminClient();
  await supa
    .from("invitations")
    .update({ status: "expired" })
    .eq("id", id)
    .eq("org_id", org.id)
    .neq("status", "submitted");
  await supa.from("audit_events").insert({
    org_id: org.id,
    invitation_id: id,
    kind: "invite.expired_manual",
  });
  revalidatePath("/admin/invitations");
}

export async function resendInvitation(id: string) {
  await requireSignedIn();
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);

  const supa = adminClient();
  const { data } = await supa
    .from("invitations")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();
  if (!data) return { ok: false, error: "Not found" } as const;
  if (!data.email) return { ok: false, error: "No email on file" } as const;
  try {
    const { sendInvitationEmail } = await import("@/lib/email");
    await sendInvitationEmail({
      to: data.email,
      firstName: data.first_name,
      token: data.token,
      orgSlug: org.slug,
      orgName: org.name,
    });
    await supa
      .from("invitations")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id);
    await supa.from("audit_events").insert({
      org_id: org.id,
      invitation_id: id,
      kind: "invite.resent",
    });
    revalidatePath("/admin/invitations");
    return { ok: true } as const;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Email send failed",
    } as const;
  }
}
