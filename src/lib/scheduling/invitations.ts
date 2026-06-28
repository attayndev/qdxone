/**
 * Scheduling invitations: the secure link a candidate uses to book. The raw
 * token lives only in the URL we hand out; the DB stores its SHA-256 hash, so a
 * database leak can't be replayed into bookings. Lookups hash the incoming token
 * and match on the hash.
 */

import "server-only";
import { createHash } from "node:crypto";
import { adminClient } from "@/lib/supabase/admin";
import { generateToken } from "@/lib/tokens";
import type { MeetingType } from "./types";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface CreateInvitationInput {
  orgId: string;
  applicationId: string;
  templateId: string;
  interviewerId: string;
  jobPostingId?: string | null;
  createdBy?: string | null;
  expiresInDays?: number;
}

/** Create an invitation and return the RAW token (caller builds the URL). */
export async function createInvitation(input: CreateInvitationInput): Promise<string> {
  const token = generateToken();
  const expires = new Date(
    Date.now() + (input.expiresInDays ?? 14) * 86_400_000
  ).toISOString();
  const { error } = await adminClient()
    .from("scheduling_invitations")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      org_id: input.orgId,
      application_id: input.applicationId,
      template_id: input.templateId,
      assigned_interviewer_id: input.interviewerId,
      job_posting_id: input.jobPostingId ?? null,
      token_hash: hashToken(token),
      expires_at: expires,
      status: "active",
      max_bookings: 1,
      created_by: input.createdBy ?? null,
    } as any);
  if (error) throw new Error(`createInvitation: ${error.message}`);
  return token;
}

export interface ResolvedInvitation {
  id: string;
  orgId: string;
  applicationId: string;
  templateId: string;
  interviewerId: string;
  status: "active" | "booked" | "revoked" | "expired";
  expiresAt: string;
  candidate: { firstName: string; lastName: string; email: string };
  template: {
    id: string;
    name: string;
    durationMinutes: number;
    meetingType: MeetingType;
    meetingLocation: string | null;
    minNoticeMinutes: number;
    maxAdvanceDays: number;
    bufferBeforeMinutes: number;
    bufferAfterMinutes: number;
    candidateInstructions: string | null;
  };
}

/** Resolve a raw token to its invitation + template + candidate, scoped to org. */
export async function getInvitationByToken(
  orgId: string,
  token: string
): Promise<ResolvedInvitation | null> {
  const supa = adminClient();
  const { data: inv } = await supa
    .from("scheduling_invitations")
    .select(
      "id, org_id, application_id, template_id, assigned_interviewer_id, status, expires_at"
    )
    .eq("org_id", orgId)
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!inv) return null;
  const i = inv as {
    id: string;
    org_id: string;
    application_id: string;
    template_id: string;
    assigned_interviewer_id: string;
    status: ResolvedInvitation["status"];
    expires_at: string;
  };

  const [{ data: app }, { data: tmpl }] = await Promise.all([
    supa
      .from("applications")
      .select("first_name, last_name, email")
      .eq("id", i.application_id)
      .maybeSingle(),
    supa
      .from("interview_templates")
      .select(
        "id, name, duration_minutes, meeting_type, meeting_location, min_notice_minutes, max_advance_days, buffer_before_minutes, buffer_after_minutes, candidate_instructions"
      )
      .eq("id", i.template_id)
      .maybeSingle(),
  ]);
  if (!app || !tmpl) return null;
  const t = tmpl as Record<string, unknown>;
  const c = app as { first_name: string; last_name: string; email: string };

  return {
    id: i.id,
    orgId: i.org_id,
    applicationId: i.application_id,
    templateId: i.template_id,
    interviewerId: i.assigned_interviewer_id,
    status: i.status,
    expiresAt: i.expires_at,
    candidate: { firstName: c.first_name, lastName: c.last_name, email: c.email },
    template: {
      id: t.id as string,
      name: t.name as string,
      durationMinutes: t.duration_minutes as number,
      meetingType: t.meeting_type as MeetingType,
      meetingLocation: (t.meeting_location as string | null) ?? null,
      minNoticeMinutes: t.min_notice_minutes as number,
      maxAdvanceDays: t.max_advance_days as number,
      bufferBeforeMinutes: t.buffer_before_minutes as number,
      bufferAfterMinutes: t.buffer_after_minutes as number,
      candidateInstructions: (t.candidate_instructions as string | null) ?? null,
    },
  };
}

export async function markInvitationBooked(id: string): Promise<void> {
  await adminClient()
    .from("scheduling_invitations")
    .update({ status: "booked" })
    .eq("id", id);
}
