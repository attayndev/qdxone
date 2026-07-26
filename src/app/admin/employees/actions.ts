"use server";

// NOTE: a "use server" module may export only async functions. Do NOT add any
// non-function export (type/const/re-export) here — it breaks the whole
// server-actions module at evaluation and 500s every action in the file.

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import { nextReviewDue, type EmployeeRow } from "@/lib/employees";

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidate(id: string) {
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${id}`);
}

/** Record a quarterly review. "No longer employed" terminates the employee. */
export async function addReview(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);
  const supa = adminClient();

  const employeeId = String(formData.get("employee_id") || "");
  if (!employeeId) return { ok: false, error: "Missing employee." };

  const { data: empRow } = await supa
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .eq("org_id", org.id)
    .maybeSingle();
  const emp = empRow as EmployeeRow | null;
  if (!emp) return { ok: false, error: "Employee not found." };

  const stillEmployed = String(formData.get("still_employed") || "yes") === "yes";
  const roleAtReview =
    String(formData.get("role_at_review") || "").trim() || emp.current_role_name;
  const ratingRaw = String(formData.get("rating") || "");
  const rating = ratingRaw ? Number(ratingRaw) : null;
  if (rating !== null && (rating < 1 || rating > 5)) {
    return { ok: false, error: "Rating must be 1–5." };
  }
  if (stillEmployed && rating === null) {
    return { ok: false, error: "Pick a rating." };
  }
  const notes = String(formData.get("notes") || "").trim() || null;

  const { error: revErr } = await supa.from("employee_reviews").insert({
    employee_id: employeeId,
    org_id: org.id,
    reviewed_by: m.user_id,
    role_at_review: roleAtReview,
    rating,
    still_employed: stillEmployed,
    notes,
  } as never);
  if (revErr) {
    console.error("addReview insert failed", revErr);
    return { ok: false, error: "Could not save the review. Try again." };
  }

  if (stillEmployed) {
    await supa
      .from("employees")
      .update({
        next_review_due: nextReviewDue(new Date(), new Date(emp.hired_at)),
      } as never)
      .eq("id", employeeId)
      .eq("org_id", org.id);
  } else {
    const reason = String(formData.get("termination_reason") || "").trim() || null;
    await supa
      .from("employees")
      .update({
        employment_status: "terminated",
        terminated_at: new Date().toISOString().slice(0, 10),
        termination_reason: reason,
        next_review_due: null,
      } as never)
      .eq("id", employeeId)
      .eq("org_id", org.id);
  }

  revalidate(employeeId);
  return { ok: true };
}

/** Change an employee's role (promotion/lateral). Logs the change. */
export async function changeRole(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);
  const supa = adminClient();

  const employeeId = String(formData.get("employee_id") || "");
  const toRole = String(formData.get("to_role") || "").trim();
  if (!employeeId || !toRole) return { ok: false, error: "Pick a role." };

  const { data: empRow } = await supa
    .from("employees")
    .select("current_role_name")
    .eq("id", employeeId)
    .eq("org_id", org.id)
    .maybeSingle();
  const emp = empRow as { current_role_name: string | null } | null;
  if (!emp) return { ok: false, error: "Employee not found." };
  if (emp.current_role_name === toRole) return { ok: true }; // no-op

  await supa
    .from("employees")
    .update({ current_role_name: toRole } as never)
    .eq("id", employeeId)
    .eq("org_id", org.id);
  await supa.from("employee_role_changes").insert({
    employee_id: employeeId,
    org_id: org.id,
    from_role: emp.current_role_name,
    to_role: toRole,
    changed_by: m.user_id,
  } as never);

  revalidate(employeeId);
  return { ok: true };
}

/** Mark an employee terminated with a reason. */
export async function terminateEmployee(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const supa = adminClient();

  const employeeId = String(formData.get("employee_id") || "");
  if (!employeeId) return { ok: false, error: "Missing employee." };
  const reason = String(formData.get("termination_reason") || "").trim() || null;

  const { error } = await supa
    .from("employees")
    .update({
      employment_status: "terminated",
      terminated_at: new Date().toISOString().slice(0, 10),
      termination_reason: reason,
      next_review_due: null,
    } as never)
    .eq("id", employeeId)
    .eq("org_id", org.id);
  if (error) {
    console.error("terminateEmployee failed", error);
    return { ok: false, error: "Could not update. Try again." };
  }

  revalidate(employeeId);
  return { ok: true };
}

/**
 * Import existing hires that predate employee tracking (idempotent). Returns
 * a message with how many were created. Triggered from the Employees list.
 */
export async function importExistingHires(): Promise<
  { ok: true; created: number } | { ok: false; error: string }
> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const { backfillEmployeesForOrg } = await import("@/lib/employees");
  const created = await backfillEmployeesForOrg(org.id);
  revalidatePath("/admin/employees");
  return { ok: true, created };
}
