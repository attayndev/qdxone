"use server";

// "use server": only async functions may be exported here.

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow } from "@/lib/tenancy";
import { requireEmployee } from "@/lib/staff-auth";

type ActionResult = { ok: true } | { ok: false; error: string };

async function hasPending(
  orgId: string,
  employeeId: string,
  shiftId: string,
  kind: "claim" | "drop"
): Promise<boolean> {
  const supa = adminClient();
  const { data } = await supa
    .from("shift_requests")
    .select("id")
    .eq("org_id", orgId)
    .eq("employee_id", employeeId)
    .eq("shift_id", shiftId)
    .eq("kind", kind)
    .eq("status", "pending")
    .maybeSingle();
  return !!data;
}

/** Request to pick up an open shift. */
export async function claimShift(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const emp = await requireEmployee(org.id);
  const shiftId = String(formData.get("shift_id") || "");
  if (!shiftId) return { ok: false, error: "Missing shift." };
  const supa = adminClient();

  const { data: shift } = await supa
    .from("shifts")
    .select("employee_id, status")
    .eq("id", shiftId)
    .eq("org_id", org.id)
    .maybeSingle();
  const s = shift as { employee_id: string | null; status: string } | null;
  if (!s || s.status !== "published" || s.employee_id !== null) {
    return { ok: false, error: "That shift isn't available anymore." };
  }
  if (await hasPending(org.id, emp.id, shiftId, "claim")) return { ok: true };

  const { error } = await supa.from("shift_requests").insert({
    org_id: org.id,
    shift_id: shiftId,
    employee_id: emp.id,
    kind: "claim",
  } as never);
  if (error) {
    console.error("claimShift failed", error);
    return { ok: false, error: "Could not request. Try again." };
  }
  revalidatePath("/staff");
  return { ok: true };
}

/** Request to drop one of the employee's own shifts. */
export async function dropShift(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const emp = await requireEmployee(org.id);
  const shiftId = String(formData.get("shift_id") || "");
  if (!shiftId) return { ok: false, error: "Missing shift." };
  const supa = adminClient();

  const { data: shift } = await supa
    .from("shifts")
    .select("employee_id")
    .eq("id", shiftId)
    .eq("org_id", org.id)
    .maybeSingle();
  if ((shift as { employee_id: string | null } | null)?.employee_id !== emp.id) {
    return { ok: false, error: "That isn't your shift." };
  }
  if (await hasPending(org.id, emp.id, shiftId, "drop")) return { ok: true };

  const { error } = await supa.from("shift_requests").insert({
    org_id: org.id,
    shift_id: shiftId,
    employee_id: emp.id,
    kind: "drop",
  } as never);
  if (error) {
    console.error("dropShift failed", error);
    return { ok: false, error: "Could not request. Try again." };
  }
  revalidatePath("/staff");
  return { ok: true };
}

/** Cancel one of the employee's own pending requests. */
export async function cancelShiftRequest(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const emp = await requireEmployee(org.id);
  const shiftId = String(formData.get("shift_id") || "");
  const kind = String(formData.get("kind") || "");
  const supa = adminClient();
  await supa
    .from("shift_requests")
    .delete()
    .eq("org_id", org.id)
    .eq("employee_id", emp.id)
    .eq("shift_id", shiftId)
    .eq("kind", kind)
    .eq("status", "pending");
  revalidatePath("/staff");
  return { ok: true };
}
