"use server";

// "use server": only async functions may be exported here.

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow } from "@/lib/tenancy";
import { requireEmployee } from "@/lib/staff-auth";

type ActionResult = { ok: true } | { ok: false; error: string };

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Propose trading one of my shifts for a specific coworker's shift. */
export async function proposeSwap(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const emp = await requireEmployee(org.id);
  const fromShiftId = String(formData.get("from_shift_id") || "");
  const toShiftId = String(formData.get("to_shift_id") || "");
  if (!fromShiftId || !toShiftId) return { ok: false, error: "Pick a shift to trade for." };
  if (fromShiftId === toShiftId) return { ok: false, error: "Pick a different shift." };
  const supa = adminClient();

  const { data: shifts } = await supa
    .from("shifts")
    .select("id, employee_id, status, shift_date")
    .in("id", [fromShiftId, toShiftId])
    .eq("org_id", org.id);
  const rows = (shifts as { id: string; employee_id: string | null; status: string; shift_date: string }[] | null) ?? [];
  const mine = rows.find((s) => s.id === fromShiftId);
  const theirs = rows.find((s) => s.id === toShiftId);

  if (!mine || mine.employee_id !== emp.id) return { ok: false, error: "That isn't your shift." };
  if (!theirs || !theirs.employee_id || theirs.employee_id === emp.id) {
    return { ok: false, error: "That shift isn't available to trade for." };
  }
  if (mine.status !== "published" || theirs.status !== "published") {
    return { ok: false, error: "Only published shifts can be swapped." };
  }
  if (mine.shift_date < todayISO() || theirs.shift_date < todayISO()) {
    return { ok: false, error: "You can only swap upcoming shifts." };
  }

  // Don't stack proposals on a shift that's already tied up in an in-flight swap.
  const { data: existing } = await supa
    .from("shift_swaps")
    .select("id")
    .eq("org_id", org.id)
    .in("status", ["proposed", "accepted"])
    .or(
      `from_shift_id.eq.${fromShiftId},to_shift_id.eq.${fromShiftId},from_shift_id.eq.${toShiftId},to_shift_id.eq.${toShiftId}`
    )
    .limit(1);
  if ((existing as { id: string }[] | null)?.length) {
    return { ok: false, error: "One of these shifts already has a swap pending." };
  }

  const { error } = await supa.from("shift_swaps").insert({
    org_id: org.id,
    from_employee_id: emp.id,
    from_shift_id: fromShiftId,
    to_employee_id: theirs.employee_id,
    to_shift_id: toShiftId,
  } as never);
  if (error) {
    console.error("proposeSwap failed", error);
    return { ok: false, error: "Could not propose the swap. Try again." };
  }
  revalidatePath("/staff");
  return { ok: true };
}

/** The target coworker accepts or declines a proposed swap. */
export async function respondSwap(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const emp = await requireEmployee(org.id);
  const swapId = String(formData.get("swap_id") || "");
  const decision = String(formData.get("decision") || "");
  if (decision !== "accept" && decision !== "decline") {
    return { ok: false, error: "Invalid response." };
  }
  const supa = adminClient();

  const { data: swap } = await supa
    .from("shift_swaps")
    .select("id, to_employee_id, status")
    .eq("id", swapId)
    .eq("org_id", org.id)
    .maybeSingle();
  const s = swap as { id: string; to_employee_id: string; status: string } | null;
  if (!s || s.to_employee_id !== emp.id) return { ok: false, error: "That swap isn't yours to answer." };
  if (s.status !== "proposed") return { ok: false, error: "This swap is no longer open." };

  const { error } = await supa
    .from("shift_swaps")
    .update({ status: decision === "accept" ? "accepted" : "declined" } as never)
    .eq("id", swapId)
    .eq("org_id", org.id)
    .eq("status", "proposed");
  if (error) {
    console.error("respondSwap failed", error);
    return { ok: false, error: "Could not save your response. Try again." };
  }
  revalidatePath("/staff");
  return { ok: true };
}

/** The proposer withdraws a swap that hasn't been approved yet. */
export async function cancelSwap(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const emp = await requireEmployee(org.id);
  const swapId = String(formData.get("swap_id") || "");
  const supa = adminClient();
  await supa
    .from("shift_swaps")
    .update({ status: "cancelled" } as never)
    .eq("id", swapId)
    .eq("org_id", org.id)
    .eq("from_employee_id", emp.id)
    .in("status", ["proposed", "accepted"]);
  revalidatePath("/staff");
  return { ok: true };
}
