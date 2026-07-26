import { notFound } from "next/navigation";
import Link from "next/link";
import { currentOrg } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import { listEmployees, ratingLabel, type EmployeeView } from "@/lib/employees";
import ImportHiresButton from "@/components/admin/ImportHiresButton";

const STATUS_CLS: Record<string, string> = {
  employed: "bg-emerald-100 text-emerald-800",
  terminated: "bg-gray-200 text-gray-600",
};

const RATING_CLS: Record<number, string> = {
  1: "bg-rose-100 text-rose-700",
  2: "bg-amber-100 text-amber-800",
  3: "bg-emerald-50 text-emerald-700",
  4: "bg-emerald-100 text-emerald-800",
  5: "bg-blue-100 text-blue-800",
};

const VIEWS = [
  { key: "all", label: "All" },
  { key: "due", label: "Reviews due" },
  { key: "employed", label: "Employed" },
  { key: "terminated", label: "Terminated" },
] as const;

type ViewKey = (typeof VIEWS)[number]["key"];

function fmtDate(d: string | null): string {
  return d ? new Date(d).toLocaleDateString() : "—";
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const sp = await searchParams;
  const view = (VIEWS.find((v) => v.key === sp.view)?.key ?? "all") as ViewKey;
  const org = await currentOrg();
  if (!org) notFound();

  const all = await listEmployees(org.id);

  // How many hired candidates aren't tracked yet (drives the import prompt).
  const supa = adminClient();
  const { count: hiredCount } = await supa
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("decision", "hired");
  const untracked = Math.max(0, (hiredCount ?? 0) - all.length);

  const dueCount = all.filter((e) => e.reviewDue).length;
  const employedCount = all.filter((e) => e.employment_status === "employed").length;
  const terminatedCount = all.filter((e) => e.employment_status === "terminated").length;

  let list: EmployeeView[] = all;
  if (view === "due") list = all.filter((e) => e.reviewDue);
  else if (view === "employed") list = all.filter((e) => e.employment_status === "employed");
  else if (view === "terminated") list = all.filter((e) => e.employment_status === "terminated");

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Employees</h1>
          <p className="text-[color:var(--brand-ink-muted)] max-w-2xl">
            Everyone you&apos;ve hired. Rate each person monthly for their first
            3 months, then quarterly — against the role they&apos;re in — track
            promotions, and record when someone leaves.
          </p>
          <Link
            href="/admin/reports"
            className="inline-block mt-2 text-sm text-[color:var(--brand-blue-600)] hover:underline"
          >
            Does the assessment predict performance? See Reports →
          </Link>
        </div>
        {untracked > 0 && <ImportHiresButton count={untracked} />}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="card">
          <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
            Employed
          </div>
          <div className="text-3xl font-black mt-1">{employedCount}</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
            Reviews due
          </div>
          <div
            className={
              "text-3xl font-black mt-1 " + (dueCount > 0 ? "text-rose-600" : "")
            }
          >
            {dueCount}
          </div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
            Terminated
          </div>
          <div className="text-3xl font-black mt-1">{terminatedCount}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {VIEWS.map((v) => {
          const active = v.key === view;
          return (
            <Link
              key={v.key}
              href={v.key === "all" ? "/admin/employees" : `/admin/employees?view=${v.key}`}
              className={
                "px-3 py-1.5 rounded-full text-sm font-semibold border " +
                (active
                  ? "border-[color:var(--brand-blue)] bg-[color:var(--brand-soft)] text-[color:var(--brand-blue-600)]"
                  : "border-[color:var(--brand-line)] text-[color:var(--brand-ink-muted)] hover:border-[color:var(--brand-blue)]")
              }
            >
              {v.label}
              {v.key === "due" && dueCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-rose-600 text-white text-xs w-5 h-5">
                  {dueCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="card mt-4 p-0 overflow-hidden">
        <ul className="divide-y divide-[color:var(--brand-line)]">
          {list.length === 0 && (
            <li className="p-6 text-sm text-[color:var(--brand-ink-muted)]">
              {all.length === 0
                ? untracked > 0
                  ? "Your hired candidates aren't tracked yet — import them to start."
                  : "No employees yet. When you mark a candidate hired, they show up here."
                : `No employees in "${VIEWS.find((v) => v.key === view)?.label}".`}
            </li>
          )}
          {list.map((e) => (
            <li key={e.id}>
              <Link
                href={`/admin/employees/${e.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-[color:var(--brand-cream)]"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {e.first_name} {e.last_name}
                  </div>
                  <div className="text-xs text-[color:var(--brand-ink-muted)] flex flex-wrap gap-2 mt-0.5">
                    <span>{e.current_role_name ?? "—"}</span>
                    {e.locationName && (
                      <>
                        <span>·</span>
                        <span>{e.locationName}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>
                      {e.employment_status === "terminated"
                        ? `Left ${fmtDate(e.terminated_at)}`
                        : `Next review ${fmtDate(e.next_review_due)}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {e.reviewDue && (
                    <span className="chip whitespace-nowrap bg-rose-600 text-white">
                      Review due
                    </span>
                  )}
                  {e.lastRating != null && (
                    <span
                      className={`chip whitespace-nowrap ${RATING_CLS[e.lastRating] ?? ""}`}
                      title={ratingLabel(e.lastRating) ?? undefined}
                    >
                      {e.lastRating}/5
                    </span>
                  )}
                  <span className={`chip whitespace-nowrap ${STATUS_CLS[e.employment_status]}`}>
                    {e.employment_status === "employed" ? "Employed" : "Terminated"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
