"use server";

import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";

const DemoSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  concept: z.string().max(120).optional().or(z.literal("")),
  units: z.string().max(40).optional().or(z.literal("")),
  note: z.string().max(2000).optional().or(z.literal("")),
});

export type DemoResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitDemoRequest(
  formData: FormData
): Promise<DemoResult> {
  const parsed = DemoSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    concept: formData.get("concept") ?? "",
    units: formData.get("units") ?? "",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: "Please fill in your name and a valid email." };
  }
  const v = parsed.data;
  const supa = adminClient();

  // Persist as a platform-level audit event (org_id null).
  await supa.from("audit_events").insert({
    kind: "lead.demo_requested",
    meta: {
      name: v.name,
      email: v.email,
      concept: v.concept || null,
      units: v.units || null,
      note: v.note || null,
      received_at: new Date().toISOString(),
    },
  });

  // Best-effort: email the platform owner(s) if Resend is wired up.
  if (process.env.RESEND_API_KEY) {
    try {
      const owners = (process.env.PLATFORM_OWNER_EMAILS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (owners.length > 0) {
        const { Resend } = await import("resend");
        const r = new Resend(process.env.RESEND_API_KEY);
        await r.emails.send({
          from: process.env.RESEND_FROM ?? "qdx <careers@qdx.one>",
          to: owners,
          subject: `New demo request from ${v.name}`,
          text: [
            `From: ${v.name} <${v.email}>`,
            `Concept: ${v.concept || "—"}`,
            `Units: ${v.units || "—"}`,
            "",
            v.note || "(no message)",
          ].join("\n"),
        });
      }
    } catch (e) {
      console.error("demo email notify failed", e);
    }
  }

  return { ok: true };
}
