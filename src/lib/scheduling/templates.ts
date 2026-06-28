/**
 * Interview-template data layer (the "interview types" an owner defines: how
 * long, where, how much notice). Service-role access after the caller has
 * checked membership. v1 is single-interviewer: each template stores exactly one
 * interviewer in the roster (the creator), but the shape is pool-ready.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import type { MeetingType } from "./types";

export interface InterviewType {
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
  isActive: boolean;
  interviewerId: string | null;
}

export interface InterviewTypeInput {
  name: string;
  durationMinutes: number;
  meetingType: MeetingType;
  meetingLocation: string | null;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  candidateInstructions: string | null;
}

interface TemplateRow {
  id: string;
  name: string;
  duration_minutes: number;
  meeting_type: MeetingType;
  meeting_location: string | null;
  min_notice_minutes: number;
  max_advance_days: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  candidate_instructions: string | null;
  is_active: boolean;
}

function toType(row: TemplateRow, interviewerId: string | null): InterviewType {
  return {
    id: row.id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    meetingType: row.meeting_type,
    meetingLocation: row.meeting_location,
    minNoticeMinutes: row.min_notice_minutes,
    maxAdvanceDays: row.max_advance_days,
    bufferBeforeMinutes: row.buffer_before_minutes,
    bufferAfterMinutes: row.buffer_after_minutes,
    candidateInstructions: row.candidate_instructions,
    isActive: row.is_active,
    interviewerId,
  };
}

function toRow(input: InterviewTypeInput) {
  return {
    name: input.name,
    duration_minutes: input.durationMinutes,
    meeting_type: input.meetingType,
    meeting_location: input.meetingLocation,
    min_notice_minutes: input.minNoticeMinutes,
    max_advance_days: input.maxAdvanceDays,
    buffer_before_minutes: input.bufferBeforeMinutes,
    buffer_after_minutes: input.bufferAfterMinutes,
    candidate_instructions: input.candidateInstructions,
    updated_at: new Date().toISOString(),
  };
}

const COLS =
  "id, name, duration_minutes, meeting_type, meeting_location, min_notice_minutes, max_advance_days, buffer_before_minutes, buffer_after_minutes, candidate_instructions, is_active";

export async function listInterviewTypes(orgId: string): Promise<InterviewType[]> {
  const supa = adminClient();
  const { data: rows } = await supa
    .from("interview_templates")
    .select(COLS)
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });
  const list = (rows as TemplateRow[] | null) ?? [];
  if (list.length === 0) return [];
  // One roster lookup for all templates (v1: a single interviewer each).
  const { data: roster } = await supa
    .from("interview_template_interviewers")
    .select("template_id, user_id, is_active")
    .in("template_id", list.map((t) => t.id));
  const byTemplate = new Map<string, string>();
  for (const r of (roster as { template_id: string; user_id: string; is_active: boolean }[] | null) ?? []) {
    if (r.is_active && !byTemplate.has(r.template_id)) byTemplate.set(r.template_id, r.user_id);
  }
  return list.map((row) => toType(row, byTemplate.get(row.id) ?? null));
}

export async function createInterviewType(
  orgId: string,
  interviewerId: string,
  input: InterviewTypeInput
): Promise<string> {
  const supa = adminClient();
  const { data, error } = await supa
    .from("interview_templates")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ org_id: orgId, assignment_type: "single", ...toRow(input) } as any)
    .select("id")
    .single();
  if (error || !data) throw new Error(`createInterviewType: ${error?.message}`);
  const id = (data as { id: string }).id;
  // Register the interviewer (the creator) for this template.
  await supa
    .from("interview_template_interviewers")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ template_id: id, user_id: interviewerId } as any);
  return id;
}

export async function updateInterviewType(
  orgId: string,
  id: string,
  input: InterviewTypeInput
): Promise<void> {
  const { error } = await adminClient()
    .from("interview_templates")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(toRow(input) as any)
    .eq("org_id", orgId)
    .eq("id", id);
  if (error) throw new Error(`updateInterviewType: ${error.message}`);
}

export async function deleteInterviewType(orgId: string, id: string): Promise<void> {
  // Roster rows cascade on template delete (FK on delete cascade).
  const { error } = await adminClient()
    .from("interview_templates")
    .delete()
    .eq("org_id", orgId)
    .eq("id", id);
  if (error) throw new Error(`deleteInterviewType: ${error.message}`);
}
