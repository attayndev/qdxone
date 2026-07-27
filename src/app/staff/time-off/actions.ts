"use server";

// "use server": only async functions may be exported here.

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow } from "@/lib/tenancy";
import { requireEmployee } from "@/lib/staff-auth";

type ActionResult = { ok: true } | { ok: false; error: string };

/** Submit a time-off request (starts pending). */
export async function requestTimeOff(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const emp = await requireEmployee(org.id);

  const startDate = String(formData.get("start_date") || "");
  const endDate = String(formData.get("end_date") || "") || startDate;
  if (!startDate) return { ok: false, error: "Pick a start date." };
  if (endDate < startDate) return { ok: false, error: "End date can't be before the start date." };
  const allDay = String(formData.get("all_day") || "yes") === "yes";
  const start = String(formData.get("start_time") || "");
  const end = String(formData.get("end_time") || "");
  if (!allDay && (!start || !end)) {
    return { ok: false, error: "Set a start and end time, or choose all day." };
  }
  const reason = String(formData.get("reason") || "").trim() || null;

  const supa = adminClient();
  const { error } = await supa.from("time_off_requests").insert({
    org_id: org.id,
    employee_id: emp.id,
    start_date: startDate,
    end_date: endDate,
    all_day: allDay,
    start_time: allDay ? null : `${start}:00`,
    end_time: allDay ? null : `${end}:00`,
    reason,
    status: "pending",
  } as never);
  if (error) {
    console.error("requestTimeOff failed", error);
    return { ok: false, error: "Could not submit. Try again." };
  }
  revalidatePath("/staff/time-off");
  return { ok: true };
}

/** Cancel one of the employee's own PENDING requests. */
export async function cancelTimeOff(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const emp = await requireEmployee(org.id);
  const id = String(formData.get("request_id") || "");
  if (!id) return { ok: false, error: "Missing request." };
  const supa = adminClient();
  await supa
    .from("time_off_requests")
    .delete()
    .eq("id", id)
    .eq("employee_id", emp.id) // scope: own only
    .eq("status", "pending"); // can't withdraw once decided
  revalidatePath("/staff/time-off");
  return { ok: true };
}
