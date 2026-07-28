"use server";

// NOTE: a "use server" module may export only async functions. Do NOT add any
// non-function export (type/const/re-export) here — it breaks the whole
// server-actions module at evaluation and 500s every action in the file.

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import { nextReviewDue, type EmployeeRow } from "@/lib/employees";
import { REVIEW_CATEGORIES } from "@/lib/review-categories";

/** Parse a 1–5 rating from form data; null if blank, out-of-range treated as null. */
function parseRating(raw: FormDataEntryValue | null): number | null {
  const n = raw ? Number(raw) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

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
  const rating = parseRating(formData.get("rating")); // overall
  if (stillEmployed && rating === null) {
    return { ok: false, error: "Pick an overall rating." };
  }
  // The four optional category ratings (same dimensions the assessment scores).
  const categoryRatings: Record<string, number | null> = {};
  for (const c of REVIEW_CATEGORIES) {
    categoryRatings[c.column] = parseRating(formData.get(c.column));
  }
  const notes = String(formData.get("notes") || "").trim() || null;

  const { error: revErr } = await supa.from("employee_reviews").insert({
    employee_id: employeeId,
    org_id: org.id,
    reviewed_by: m.user_id,
    role_at_review: roleAtReview,
    rating,
    ...categoryRatings,
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

/** Set an employee's hourly wage (manager-only; drives labor-cost projection). */
export async function setEmployeeWage(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const supa = adminClient();
  const employeeId = String(formData.get("employee_id") || "");
  if (!employeeId) return { ok: false, error: "Missing employee." };
  const raw = String(formData.get("hourly_wage") || "").trim();
  const wage = raw === "" ? null : Number(raw);
  if (wage !== null && (!Number.isFinite(wage) || wage < 0 || wage > 100000)) {
    return { ok: false, error: "Enter a valid hourly wage." };
  }
  await supa
    .from("employees")
    .update({ hourly_wage: wage } as never)
    .eq("id", employeeId)
    .eq("org_id", org.id);
  revalidate(employeeId);
  return { ok: true };
}

/** Send the assessment (as a team benchmark) to one employee. Skips if already sent. */
async function sendOneAssessment(
  ctx: { orgId: string; orgSlug: string; orgName: string; replyTo?: string },
  emp: { application_id: string | null; email: string | null; first_name: string; location_id: string | null }
): Promise<"sent" | "skip"> {
  if (!emp.application_id || !emp.email) return "skip";
  const supa = adminClient();
  const { data: existing } = await supa
    .from("assessment_sessions")
    .select("id")
    .eq("application_id", emp.application_id)
    .eq("subject_type", "candidate")
    .maybeSingle();
  if (existing) return "skip";

  const { createCandidateAssessment } = await import("@/lib/assessment/session");
  const token = await createCandidateAssessment({
    orgId: ctx.orgId,
    locationId: emp.location_id,
    applicationId: emp.application_id,
  });
  const { sendBenchmarkAssessmentEmail } = await import("@/lib/email");
  await sendBenchmarkAssessmentEmail({
    to: emp.email,
    firstName: emp.first_name,
    orgSlug: ctx.orgSlug,
    orgName: ctx.orgName,
    token,
    replyTo: ctx.replyTo,
  });
  await supa.from("applications").update({ status: "assessment_sent" } as never).eq("id", emp.application_id);
  return "sent";
}

/** Send the assessment to one employee (benchmark). */
export async function sendEmployeeAssessment(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const supa = adminClient();
  const employeeId = String(formData.get("employee_id") || "");
  if (!employeeId) return { ok: false, error: "Missing employee." };
  const { data: emp } = await supa
    .from("employees")
    .select("application_id, email, first_name, location_id")
    .eq("id", employeeId)
    .eq("org_id", org.id)
    .maybeSingle();
  const e = emp as { application_id: string | null; email: string | null; first_name: string; location_id: string | null } | null;
  if (!e) return { ok: false, error: "Employee not found." };
  if (!e.email) return { ok: false, error: "This employee has no email on file." };

  const { orgReplyTo } = await import("@/lib/email");
  const replyTo = await orgReplyTo(org.id);
  const res = await sendOneAssessment({ orgId: org.id, orgSlug: org.slug, orgName: org.name, replyTo }, e);
  if (res === "skip") return { ok: false, error: "The assessment was already sent to this person." };
  revalidate(employeeId);
  return { ok: true };
}

/** Bulk: send the assessment to every employee who hasn't been sent it. */
export async function sendTeamAssessments(): Promise<
  { ok: true; sent: number } | { ok: false; error: string }
> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const supa = adminClient();
  const { data: emps } = await supa
    .from("employees")
    .select("application_id, email, first_name, location_id")
    .eq("org_id", org.id)
    .eq("employment_status", "employed");
  const rows = (emps as { application_id: string | null; email: string | null; first_name: string; location_id: string | null }[] | null) ?? [];

  const { orgReplyTo } = await import("@/lib/email");
  const replyTo = await orgReplyTo(org.id);
  const ctx = { orgId: org.id, orgSlug: org.slug, orgName: org.name, replyTo };
  let sent = 0;
  for (const e of rows) {
    const res = await sendOneAssessment(ctx, e);
    if (res === "sent") sent++;
  }
  revalidatePath("/admin/employees");
  return { ok: true, sent };
}

/** Invite (or re-invite) an employee to the /staff portal: email a set-password link. */
export async function inviteEmployeeToStaff(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const supa = adminClient();
  const employeeId = String(formData.get("employee_id") || "");
  if (!employeeId) return { ok: false, error: "Missing employee." };

  const { data: emp } = await supa
    .from("employees")
    .select("email")
    .eq("id", employeeId)
    .eq("org_id", org.id)
    .maybeSingle();
  const email = (emp as { email: string | null } | null)?.email;
  if (!email) return { ok: false, error: "This employee has no email on file — add one first." };

  const { sendStaffSetupLink } = await import("@/lib/staff-invite");
  const { matched } = await sendStaffSetupLink({
    orgId: org.id,
    orgSlug: org.slug,
    orgName: org.name,
    email,
  });
  if (!matched) return { ok: false, error: "Could not match this employee. Try again." };
  revalidate(employeeId);
  return { ok: true };
}

/** Revoke portal access: unlink the account and clear the invite. */
export async function revokeStaffAccess(formData: FormData): Promise<ActionResult> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const supa = adminClient();
  const employeeId = String(formData.get("employee_id") || "");
  if (!employeeId) return { ok: false, error: "Missing employee." };
  await supa
    .from("employees")
    .update({ user_id: null, invited_at: null, activated_at: null } as never)
    .eq("id", employeeId)
    .eq("org_id", org.id);
  revalidate(employeeId);
  return { ok: true };
}

/**
 * Import an existing (pre-qdx) team from a CSV. Each valid row becomes an
 * employee + a "shadow application" (source='roster_import') so the assessment +
 * fit analytics work for them. Dedupes by email against the current roster.
 */
export async function importTeamCsv(
  formData: FormData
): Promise<{ ok: true; created: number; skipped: number } | { ok: false; error: string }> {
  const org = await currentOrgOrThrow();
  await requireMembership(org.id);
  const csv = String(formData.get("csv") || "");
  if (!csv.trim()) return { ok: false, error: "No file contents." };

  const { getPrimaryLocation } = await import("@/lib/locations");
  const loc = await getPrimaryLocation(org.id);
  if (!loc) return { ok: false, error: "Add a store first (Store page), then import your team." };

  const supa = adminClient();
  // Dedupe against BOTH the employee's own email AND their application's email —
  // older records (e.g. imported hires) can have a blank employees.email.
  const { data: existing } = await supa
    .from("employees")
    .select("email, application_id")
    .eq("org_id", org.id);
  const empRows = (existing as { email: string | null; application_id: string | null }[] | null) ?? [];
  const appIds = empRows.map((e) => e.application_id).filter((x): x is string => !!x);
  const { data: appEmails } = appIds.length
    ? await supa.from("applications").select("email").in("id", appIds)
    : { data: [] as { email: string | null }[] };
  const existingEmails = new Set(
    [
      ...empRows.map((e) => e.email),
      ...((appEmails as { email: string | null }[] | null) ?? []).map((a) => a.email),
    ]
      .filter((x): x is string => !!x)
      .map((x) => x.toLowerCase())
  );

  const csvLib = await import("@/lib/team-csv");
  const hasHeader = String(formData.get("has_header") ?? "true") !== "false";
  const mappingRaw = String(formData.get("mapping") || "");
  let parsed;
  if (mappingRaw) {
    const mapping = JSON.parse(mappingRaw) as import("@/lib/team-csv").FieldMapping;
    const { dataRows } = csvLib.csvColumns(csv, hasHeader);
    parsed = csvLib.buildRows(dataRows, mapping, existingEmails);
  } else {
    parsed = csvLib.parseTeamCsv(csv, existingEmails);
  }
  if (parsed.headerError) return { ok: false, error: parsed.headerError };

  const { generateToken } = await import("@/lib/tokens");
  const now = new Date();
  const nowIso = now.toISOString();
  const likeLiteral = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);
  let created = 0;
  for (const row of parsed.rows) {
    if (!row.ok) continue;

    // If this person already applied (has an application), link the employee to
    // THAT application — don't create a duplicate shadow app. Mark it hired since
    // they're now on staff, so they leave the active candidate pipeline.
    const { data: candApp } = await supa
      .from("applications")
      .select("id, decision")
      .eq("org_id", org.id)
      .ilike("email", likeLiteral(row.email))
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    let appId: string | undefined = (candApp as { id: string; decision: string | null } | null)?.id;

    if (appId) {
      if (!(candApp as { decision: string | null }).decision) {
        await supa
          .from("applications")
          .update({ decision: "hired", decision_at: nowIso, status: "decision_made" } as never)
          .eq("id", appId);
      }
    } else {
      const { data: appRow } = await supa
        .from("applications")
        .insert({
          org_id: org.id,
          location_id: loc.id,
          resume_token: generateToken(),
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          phone: row.phone || null,
          positions: row.role ? [row.role] : [],
          status: "new",
          source: "roster_import",
          submitted_at: nowIso,
        } as never)
        .select("id")
        .single();
      appId = (appRow as { id: string } | null)?.id;
    }
    if (!appId) continue;

    const { data: empRow } = await supa
      .from("employees")
      .insert({
        org_id: org.id,
        location_id: loc.id,
        application_id: appId,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        current_role_name: row.role || null,
        employment_status: "employed",
        hired_at: nowIso.slice(0, 10),
        next_review_due: nextReviewDue(now, now),
      } as never)
      .select("id")
      .single();
    const empId = (empRow as { id: string } | null)?.id;
    if (empId && row.role) {
      await supa.from("employee_role_changes").insert({
        employee_id: empId,
        org_id: org.id,
        from_role: null,
        to_role: row.role,
      } as never);
    }
    created++;
  }

  revalidatePath("/admin/employees");
  return { ok: true, created, skipped: parsed.skipCount };
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
