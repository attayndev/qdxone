"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentOrgOrThrow, requireMembership, orgUrl } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import { createInvitation } from "@/lib/scheduling/invitations";
import { cancelBooking } from "@/lib/scheduling/bookings";
import { disconnect } from "@/lib/scheduling/connections";
import { listInterviewTypes } from "@/lib/scheduling/templates";
import { sendBookingInvite, orgReplyTo } from "@/lib/email";
import {
  setWeeklySchedule,
  type WeeklyWindow,
} from "@/lib/scheduling/availability-rules";
import {
  createInterviewType,
  updateInterviewType,
  deleteInterviewType,
  type InterviewTypeInput,
} from "@/lib/scheduling/templates";
import type { CalendarProviderId } from "@/lib/calendar-providers/provider";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Disconnect the current user's calendar for this org (best-effort revoke). */
export async function disconnectCalendar(provider: CalendarProviderId): Promise<void> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);
  await disconnect(org.id, m.user_id, provider);
  revalidatePath("/admin/scheduling");
}

/** Cancel an upcoming interview (frees the slot, deletes the event, notifies). */
export async function cancelInterview(bookingId: string): Promise<void> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  await cancelBooking(org.id, bookingId);
  revalidatePath("/admin/scheduling");
}

// ── Availability ─────────────────────────────────────────────────────────────

/**
 * The weekly editor posts, per day 0–6: `enabled_N`, `start_N`, `end_N` (HH:MM),
 * plus a single `timezone`. We rebuild the whole schedule from that.
 */
export async function saveAvailability(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);

  const timezone = String(formData.get("timezone") ?? "America/New_York");
  const toMin = (v: FormDataEntryValue | null): number | null => {
    if (!v) return null;
    const [h, mm] = String(v).split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(mm)) return null;
    return h * 60 + mm;
  };

  const windows: WeeklyWindow[] = [];
  for (let d = 0; d < 7; d++) {
    if (formData.get(`enabled_${d}`) == null) continue;
    const start = toMin(formData.get(`start_${d}`));
    const end = toMin(formData.get(`end_${d}`));
    if (start == null || end == null) continue;
    if (end <= start) {
      return { ok: false, error: `End time must be after start time on day ${d}.` };
    }
    windows.push({ dayOfWeek: d, startMinutes: start, endMinutes: end });
  }

  try {
    await setWeeklySchedule(org.id, m.user_id, { timezone, windows });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save." };
  }
  revalidatePath("/admin/scheduling");
  return { ok: true };
}

// ── Interview types ──────────────────────────────────────────────────────────

const MEETING_TYPES = [
  "in_person",
  "phone",
  "google_meet",
] as const;

const InterviewTypeSchema = z.object({
  name: z.string().trim().min(1, "Give it a name").max(80),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  meetingType: z.enum(MEETING_TYPES),
  meetingLocation: z.string().trim().max(300).optional().or(z.literal("")),
  minNoticeMinutes: z.coerce.number().int().min(0).max(43200),
  maxAdvanceDays: z.coerce.number().int().min(1).max(365),
  bufferBeforeMinutes: z.coerce.number().int().min(0).max(120),
  bufferAfterMinutes: z.coerce.number().int().min(0).max(120),
  candidateInstructions: z.string().trim().max(1000).optional().or(z.literal("")),
});

function parseInterviewType(formData: FormData):
  | { ok: true; input: InterviewTypeInput }
  | { ok: false; error: string } {
  const parsed = InterviewTypeSchema.safeParse({
    name: formData.get("name") ?? "",
    durationMinutes: formData.get("durationMinutes") ?? "30",
    meetingType: formData.get("meetingType") ?? "in_person",
    meetingLocation: formData.get("meetingLocation") ?? "",
    minNoticeMinutes: formData.get("minNoticeMinutes") ?? "240",
    maxAdvanceDays: formData.get("maxAdvanceDays") ?? "21",
    bufferBeforeMinutes: formData.get("bufferBeforeMinutes") ?? "0",
    bufferAfterMinutes: formData.get("bufferAfterMinutes") ?? "0",
    candidateInstructions: formData.get("candidateInstructions") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  return {
    ok: true,
    input: {
      name: v.name,
      durationMinutes: v.durationMinutes,
      meetingType: v.meetingType,
      meetingLocation: v.meetingLocation ? v.meetingLocation : null,
      minNoticeMinutes: v.minNoticeMinutes,
      maxAdvanceDays: v.maxAdvanceDays,
      bufferBeforeMinutes: v.bufferBeforeMinutes,
      bufferAfterMinutes: v.bufferAfterMinutes,
      candidateInstructions: v.candidateInstructions ? v.candidateInstructions : null,
    },
  };
}

export async function saveInterviewType(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);
  const parsed = parseInterviewType(formData);
  if (!parsed.ok) return parsed;

  const id = String(formData.get("id") ?? "");
  try {
    if (id) {
      await updateInterviewType(org.id, id, parsed.input);
    } else {
      await createInterviewType(org.id, m.user_id, parsed.input);
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save." };
  }
  revalidatePath("/admin/scheduling");
  return { ok: true };
}

export async function removeInterviewType(id: string): Promise<void> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  await deleteInterviewType(org.id, id);
  revalidatePath("/admin/scheduling");
}

// ── Invitations ──────────────────────────────────────────────────────────────

export type InviteResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export type EmailInviteResult =
  | { ok: true; sentTo: string }
  | { ok: false; error: string };

interface MintedInvite {
  url: string;
  application: { email: string; first_name: string };
  orgId: string;
  orgName: string;
  templateName: string;
}

/** Shared: resolve interviewer, create the invitation, return URL + candidate. */
async function mintInvite(applicationId: string, templateId: string): Promise<MintedInvite> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);
  const supa = adminClient();

  // The interviewer is the template's roster entry (v1: a single one).
  const { data: roster } = await supa
    .from("interview_template_interviewers")
    .select("user_id, is_active")
    .eq("template_id", templateId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  const interviewerId = (roster as { user_id: string } | null)?.user_id ?? m.user_id;

  const { data: appRow } = await supa
    .from("applications")
    .select("job_posting_id, email, first_name")
    .eq("id", applicationId)
    .eq("org_id", org.id)
    .maybeSingle();
  const app = appRow as { job_posting_id: string | null; email: string; first_name: string } | null;
  if (!app) throw new Error("Candidate not found.");

  const types = await listInterviewTypes(org.id);
  const templateName = types.find((t) => t.id === templateId)?.name ?? "interview";

  const token = await createInvitation({
    orgId: org.id,
    applicationId,
    templateId,
    interviewerId,
    jobPostingId: app.job_posting_id,
    createdBy: m.user_id,
  });
  return {
    url: orgUrl(org.slug, `/interview/${token}`),
    application: { email: app.email, first_name: app.first_name },
    orgId: org.id,
    orgName: org.name,
    templateName,
  };
}

/** Mint a candidate booking link (the owner shares it manually). */
export async function createInterviewInvite(
  applicationId: string,
  templateId: string
): Promise<InviteResult> {
  try {
    const { url } = await mintInvite(applicationId, templateId);
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not create the link." };
  }
}

/** Mint a booking link AND email it to the candidate, as the store. */
export async function emailInterviewInvite(
  applicationId: string,
  templateId: string
): Promise<EmailInviteResult> {
  try {
    const inv = await mintInvite(applicationId, templateId);
    if (!inv.application.email) return { ok: false, error: "This candidate has no email on file." };
    await sendBookingInvite({
      to: inv.application.email,
      firstName: inv.application.first_name,
      orgName: inv.orgName,
      replyTo: await orgReplyTo(inv.orgId),
      interviewName: inv.templateName,
      link: inv.url,
    });
    return { ok: true, sentTo: inv.application.email };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not send the invite." };
  }
}
