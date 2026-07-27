"use server";

// NOTE: a "use server" module may export only async functions. Do NOT add any
// non-function export (type/const/re-export) here.

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import {
  weekDates,
  addDays,
  shiftsOverlap,
  shiftHitsUnavailability,
  copyWeekShifts,
  formatTimeRange,
  hasUnpublishedChanges,
  type ShiftRow,
} from "@/lib/shifts-core";
import { unavailabilityForEmployee } from "@/lib/availability";

type ActionResult = { ok: true; warning?: string } | { ok: false; error: string };

/** Soft warning if this shift lands on the employee's blocked-off time. */
async function unavailWarning(
  orgId: string,
  employeeId: string | null,
  shift: { shift_date: string; start_time: string; end_time: string }
): Promise<string | undefined> {
  if (!employeeId) return undefined;
  const blocks = await unavailabilityForEmployee(orgId, employeeId);
  return shiftHitsUnavailability(shift, blocks)
    ? "Scheduled — but heads up, this is during a time they marked they can't work."
    : undefined;
}

function revalidate() {
  revalidatePath("/admin/schedule");
}

/** Reject if this employee already has an overlapping shift that day. */
async function hasConflict(
  orgId: string,
  employeeId: string,
  shiftDate: string,
  startTime: string,
  endTime: string,
  excludeShiftId?: string
): Promise<boolean> {
  const supa = adminClient();
  const { data } = await supa
    .from("shifts")
    .select("id, start_time, end_time")
    .eq("org_id", orgId)
    .eq("employee_id", employeeId)
    .eq("shift_date", shiftDate);
  const others = ((data as { id: string; start_time: string; end_time: string }[] | null) ?? []).filter(
    (s) => s.id !== excludeShiftId
  );
  return others.some((s) => shiftsOverlap({ start_time: startTime, end_time: endTime }, s));
}

interface ShiftFields {
  location_id: string;
  employee_id: string | null;
  role: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
}

function readShiftFields(formData: FormData): ShiftFields | { error: string } {
  const shift_date = String(formData.get("shift_date") || "");
  const start_time = String(formData.get("start_time") || "");
  const end_time = String(formData.get("end_time") || "");
  const location_id = String(formData.get("location_id") || "");
  if (!location_id) return { error: "Pick a store." };
  if (!shift_date || !start_time || !end_time) return { error: "Pick a day and start/end time." };
  const employee_id = String(formData.get("employee_id") || "").trim() || null;
  return {
    location_id,
    employee_id,
    role: String(formData.get("role") || "").trim() || null,
    shift_date,
    start_time,
    end_time,
    notes: String(formData.get("notes") || "").trim() || null,
  };
}

export async function createShift(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);
  const f = readShiftFields(formData);
  if ("error" in f) return { ok: false, error: f.error };

  if (f.employee_id && (await hasConflict(org.id, f.employee_id, f.shift_date, f.start_time, f.end_time))) {
    return { ok: false, error: "That person already has an overlapping shift that day." };
  }

  const supa = adminClient();
  const { error } = await supa.from("shifts").insert({
    org_id: org.id,
    location_id: f.location_id,
    employee_id: f.employee_id,
    role: f.role,
    shift_date: f.shift_date,
    start_time: f.start_time,
    end_time: f.end_time,
    status: "draft",
    notes: f.notes,
    created_by: m.user_id,
  } as never);
  if (error) {
    console.error("createShift failed", error);
    return { ok: false, error: "Could not add the shift. Try again." };
  }
  const warning = await unavailWarning(org.id, f.employee_id, {
    shift_date: f.shift_date,
    start_time: f.start_time,
    end_time: f.end_time,
  });
  revalidate();
  return { ok: true, warning };
}

export async function updateShift(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const id = String(formData.get("shift_id") || "");
  if (!id) return { ok: false, error: "Missing shift." };
  const f = readShiftFields(formData);
  if ("error" in f) return { ok: false, error: f.error };

  if (f.employee_id && (await hasConflict(org.id, f.employee_id, f.shift_date, f.start_time, f.end_time, id))) {
    return { ok: false, error: "That person already has an overlapping shift that day." };
  }

  const supa = adminClient();
  const { error } = await supa
    .from("shifts")
    .update({
      location_id: f.location_id,
      employee_id: f.employee_id,
      role: f.role,
      shift_date: f.shift_date,
      start_time: f.start_time,
      end_time: f.end_time,
      notes: f.notes,
    } as never)
    .eq("id", id)
    .eq("org_id", org.id);
  if (error) {
    console.error("updateShift failed", error);
    return { ok: false, error: "Could not save the shift. Try again." };
  }
  const warning = await unavailWarning(org.id, f.employee_id, {
    shift_date: f.shift_date,
    start_time: f.start_time,
    end_time: f.end_time,
  });
  revalidate();
  return { ok: true, warning };
}

export async function deleteShift(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const id = String(formData.get("shift_id") || "");
  if (!id) return { ok: false, error: "Missing shift." };
  const supa = adminClient();
  await supa.from("shifts").delete().eq("id", id).eq("org_id", org.id);
  revalidate();
  return { ok: true };
}

/** Convert an assigned shift into an open (unassigned) shift. */
export async function moveShiftToOpen(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const id = String(formData.get("shift_id") || "");
  if (!id) return { ok: false, error: "Missing shift." };
  const supa = adminClient();
  await supa.from("shifts").update({ employee_id: null } as never).eq("id", id).eq("org_id", org.id);
  revalidate();
  return { ok: true };
}

/** Copy the previous week's shifts into the target week (drafts). */
export async function copyPreviousWeek(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);
  const anchor = String(formData.get("target_anchor") || "");
  if (!anchor) return { ok: false, error: "Missing week." };
  const target = weekDates(anchor);
  const source = weekDates(addDays(target[0], -7));

  const supa = adminClient();
  const { data: existing } = await supa
    .from("shifts")
    .select("id")
    .eq("org_id", org.id)
    .gte("shift_date", target[0])
    .lte("shift_date", target[6])
    .limit(1);
  if (((existing as unknown[] | null) ?? []).length > 0) {
    return { ok: false, error: "This week already has shifts. Clear them first, or edit them directly." };
  }

  const { data: src } = await supa
    .from("shifts")
    .select("*")
    .eq("org_id", org.id)
    .gte("shift_date", source[0])
    .lte("shift_date", source[6]);
  const srcShifts = (src as ShiftRow[] | null) ?? [];
  if (srcShifts.length === 0) return { ok: false, error: "Last week has no shifts to copy." };

  const rows = copyWeekShifts(srcShifts).map((r) => ({
    ...r,
    org_id: org.id,
    status: "draft",
    created_by: m.user_id,
  }));
  const { error } = await supa.from("shifts").insert(rows as never);
  if (error) {
    console.error("copyPreviousWeek failed", error);
    return { ok: false, error: "Could not copy last week. Try again." };
  }
  revalidate();
  return { ok: true };
}

/**
 * Publish the week: flip changed/draft shifts to published, then email each
 * affected employee their lineup. (SMS is a later opt-in add.)
 */
export async function publishWeek(
  formData: FormData
): Promise<{ ok: true; published: number; notified: number } | { ok: false; error: string }> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const anchor = String(formData.get("target_anchor") || "");
  if (!anchor) return { ok: false, error: "Missing week." };
  const dates = weekDates(anchor);
  const supa = adminClient();

  const { data } = await supa
    .from("shifts")
    .select("*")
    .eq("org_id", org.id)
    .gte("shift_date", dates[0])
    .lte("shift_date", dates[6]);
  const shifts = (data as ShiftRow[] | null) ?? [];
  const toPublish = shifts.filter(hasUnpublishedChanges);
  if (toPublish.length === 0) return { ok: true, published: 0, notified: 0 };

  const now = new Date().toISOString();
  const { error } = await supa
    .from("shifts")
    .update({ status: "published", published_at: now } as never)
    .in(
      "id",
      toPublish.map((s) => s.id)
    );
  if (error) {
    console.error("publishWeek failed", error);
    return { ok: false, error: "Could not publish. Try again." };
  }

  // Notify each affected employee (had a changed/new shift) their week lineup.
  const affected = new Set(toPublish.map((s) => s.employee_id).filter((x): x is string => !!x));
  revalidate();

  after(async () => {
    try {
      if (affected.size === 0) return;
      const { sendOperatorEmail } = await import("@/lib/email");
      // Employee contact email lives on their source application.
      const { data: empRows } = await supa
        .from("employees")
        .select("id, first_name, application_id")
        .in("id", [...affected]);
      const employees = (empRows as { id: string; first_name: string; application_id: string | null }[] | null) ?? [];
      const appIds = employees.map((e) => e.application_id).filter((x): x is string => !!x);
      const { data: apps } = await supa
        .from("applications")
        .select("id, email")
        .in("id", appIds.length ? appIds : ["__none__"]);
      const emailByApp = new Map(
        ((apps as { id: string; email: string }[] | null) ?? []).map((a) => [a.id, a.email])
      );

      const label = `${new Date(dates[0]).toLocaleDateString()}–${new Date(dates[6]).toLocaleDateString()}`;
      for (const emp of employees) {
        const to = emp.application_id ? emailByApp.get(emp.application_id) : undefined;
        if (!to) continue;
        const mine = shifts
          .filter((s) => s.employee_id === emp.id && s.status === "published")
          .sort((a, b) => (a.shift_date + a.start_time).localeCompare(b.shift_date + b.start_time));
        const lines = mine.map(
          (s) => `${new Date(s.shift_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}: ${formatTimeRange(s.start_time, s.end_time)}${s.role ? ` (${s.role})` : ""}`
        );
        if (lines.length === 0) continue;
        await sendOperatorEmail({
          to: [to],
          subject: `Your ${org.name} schedule for ${label}`,
          text: `Hi ${emp.first_name},\n\nHere's your schedule for ${label}:\n\n${lines.join("\n")}\n\n— ${org.name}`,
          html: `<p>Hi ${emp.first_name},</p><p>Here's your schedule for <strong>${label}</strong>:</p><ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul><p>— ${org.name}</p>`,
        });
      }
    } catch (e) {
      console.error("publishWeek notify failed", e);
    }
  });

  return { ok: true, published: toPublish.length, notified: affected.size };
}
