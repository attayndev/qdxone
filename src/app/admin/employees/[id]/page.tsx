import { notFound } from "next/navigation";
import Link from "next/link";
import { currentOrg } from "@/lib/tenancy";
import { orgRoles } from "@/lib/roles";
import { getEmployee, ratingLabel } from "@/lib/employees";
import { REVIEW_CATEGORIES } from "@/lib/review-categories";
import EmployeeActions from "@/components/admin/EmployeeActions";
import StaffAccessControl from "@/components/admin/StaffAccessControl";
import WageControl from "@/components/admin/WageControl";

const RATING_CLS: Record<number, string> = {
  1: "bg-rose-100 text-rose-700",
  2: "bg-amber-100 text-amber-800",
  3: "bg-emerald-50 text-emerald-700",
  4: "bg-emerald-100 text-emerald-800",
  5: "bg-blue-100 text-blue-800",
};

function fmtDate(d: string | null): string {
  return d ? new Date(d).toLocaleDateString() : "—";
}

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await currentOrg();
  if (!org) notFound();
  const detail = await getEmployee(org.id, id);
  if (!detail) notFound();
  const { employee: e, reviews, roleChanges } = detail;
  const roles = orgRoles(org.branding);

  return (
    <div>
      <Link
        href="/admin/employees"
        className="text-sm text-[color:var(--brand-ink-muted)] hover:underline"
      >
        ← Employees
      </Link>

      <div className="flex items-start justify-between gap-3 flex-wrap mt-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            {e.first_name} {e.last_name}
          </h1>
          <div className="text-[color:var(--brand-ink-muted)] flex flex-wrap gap-2 mt-1 text-sm">
            <span className="font-semibold text-[color:var(--brand-ink)]">
              {e.current_role_name ?? "No role set"}
            </span>
            {e.locationName && (
              <>
                <span>·</span>
                <span>{e.locationName}</span>
              </>
            )}
            <span>·</span>
            <span>Hired {fmtDate(e.hired_at)}</span>
          </div>
        </div>
        <span
          className={
            "chip " +
            (e.employment_status === "employed"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-gray-200 text-gray-600")
          }
        >
          {e.employment_status === "employed" ? "Employed" : "Terminated"}
        </span>
      </div>

      {e.application_id && (
        <Link
          href={`/admin/candidates/${e.application_id}`}
          className="inline-block mt-2 text-sm text-[color:var(--brand-blue-600)] hover:underline"
        >
          View their assessment →
        </Link>
      )}

      {e.employment_status === "terminated" && (
        <div className="card mt-5 border-l-4 border-l-gray-400">
          <div className="font-bold">No longer employed</div>
          <div className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
            Left {fmtDate(e.terminated_at)}
            {e.termination_reason ? ` — ${e.termination_reason}` : ""}
          </div>
        </div>
      )}

      {/* Employee portal access (Phase 2a) */}
      {e.employment_status === "employed" && (
        <StaffAccessControl
          employeeId={e.id}
          email={e.email}
          invitedAt={e.invited_at}
          activatedAt={e.activated_at}
        />
      )}

      {/* Hourly wage — manager-only, drives labor-cost projection (Phase 5) */}
      {e.employment_status === "employed" && (
        <WageControl employeeId={e.id} wage={e.hourly_wage} />
      )}

      {/* Interactive controls (add review / change role / terminate) */}
      <EmployeeActions
        employeeId={e.id}
        status={e.employment_status}
        currentRole={e.current_role_name}
        roles={roles}
        nextReviewDue={e.next_review_due}
        reviewDue={e.reviewDue}
      />

      {/* Review history */}
      <h2 className="text-xl font-black tracking-tight mt-8">Reviews</h2>
      <div className="card mt-2 p-0 overflow-hidden">
        {reviews.length === 0 ? (
          <div className="p-5 text-sm text-[color:var(--brand-ink-muted)]">
            No reviews yet.
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--brand-line)]">
            {reviews.map((r) => (
              <li key={r.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">
                    {new Date(r.reviewed_at).toLocaleDateString()}
                    {r.role_at_review && (
                      <span className="font-normal text-[color:var(--brand-ink-muted)]">
                        {" "}
                        · {r.role_at_review}
                      </span>
                    )}
                  </div>
                  {r.rating != null ? (
                    <span className={`chip ${RATING_CLS[r.rating] ?? ""}`}>
                      {r.rating}/5 · {ratingLabel(r.rating)}
                    </span>
                  ) : (
                    !r.still_employed && (
                      <span className="chip bg-gray-200 text-gray-600">Departed</span>
                    )
                  )}
                </div>
                {REVIEW_CATEGORIES.some((c) => r[c.column] != null) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {REVIEW_CATEGORIES.map((c) =>
                      r[c.column] != null ? (
                        <span
                          key={c.column}
                          className="chip bg-[color:var(--brand-cream)] text-[color:var(--brand-ink)]"
                          title={ratingLabel(r[c.column]) ?? undefined}
                        >
                          {c.label} {r[c.column]}/5
                        </span>
                      ) : null
                    )}
                  </div>
                )}
                {r.notes && (
                  <div className="text-sm text-[color:var(--brand-ink-muted)] mt-1.5 whitespace-pre-wrap">
                    {r.notes}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Role / promotion history */}
      <h2 className="text-xl font-black tracking-tight mt-8">Role history</h2>
      <div className="card mt-2 p-0 overflow-hidden">
        {roleChanges.length === 0 ? (
          <div className="p-5 text-sm text-[color:var(--brand-ink-muted)]">
            No role changes recorded.
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--brand-line)]">
            {roleChanges.map((c) => (
              <li key={c.id} className="p-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">
                  {c.from_role ? (
                    <>
                      {c.from_role} → <span className="text-[color:var(--brand-blue-600)]">{c.to_role}</span>
                    </>
                  ) : (
                    <>Started as {c.to_role}</>
                  )}
                </div>
                <div className="text-xs text-[color:var(--brand-ink-muted)]">
                  {new Date(c.changed_at).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
