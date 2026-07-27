"use server";

// "use server": only async functions may be exported here.

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow } from "@/lib/tenancy";
import { requireEmployee } from "@/lib/staff-auth";

type ActionResult = { ok: true } | { ok: false; error: string };

/** Add a block-off (unavailable) time for the signed-in employee. */
export async function addUnavailability(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const emp = await requireEmployee(org.id);

  const dow = Number(formData.get("day_of_week"));
  if (!Number.isInteger(dow) || dow < 0 || dow > 6) {
    return { ok: false, error: "Pick a day." };
  }
  const allDay = String(formData.get("all_day") || "") === "yes";
  const start = String(formData.get("start_time") || "");
  const end = String(formData.get("end_time") || "");
  if (!allDay && (!start || !end)) {
    return { ok: false, error: "Set a start and end time, or choose all day." };
  }
  const note = String(formData.get("note") || "").trim() || null;

  const supa = adminClient();
  const { error } = await supa.from("employee_unavailability").insert({
    org_id: org.id,
    employee_id: emp.id,
    day_of_week: dow,
    all_day: allDay,
    start_time: allDay ? null : `${start}:00`,
    end_time: allDay ? null : `${end}:00`,
    note,
  } as never);
  if (error) {
    console.error("addUnavailability failed", error);
    return { ok: false, error: "Could not save. Try again." };
  }
  revalidatePath("/staff/availability");
  return { ok: true };
}

/** Remove one of the signed-in employee's block-off times. */
export async function removeUnavailability(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const emp = await requireEmployee(org.id);
  const id = String(formData.get("block_id") || "");
  if (!id) return { ok: false, error: "Missing block." };
  const supa = adminClient();
  await supa
    .from("employee_unavailability")
    .delete()
    .eq("id", id)
    .eq("employee_id", emp.id); // scope: only their own
  revalidatePath("/staff/availability");
  return { ok: true };
}
