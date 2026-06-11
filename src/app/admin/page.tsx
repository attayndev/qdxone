import { notFound } from "next/navigation";
import Link from "next/link";
import { currentOrg } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type AppRow = Database["public"]["Tables"]["applications"]["Row"];

export default async function AdminDashboard() {
  const org = await currentOrg();
  if (!org) notFound();
  const supa = adminClient();

  const [{ data: apps }, { count: openPostings }] = await Promise.all([
    supa
      .from("applications")
      .select("*")
      .eq("org_id", org.id)
      .order("submitted_at", { ascending: false })
      .limit(200),
    supa
      .from("job_postings")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id)
      .eq("status", "open"),
  ]);

  const applications = (apps as AppRow[] | null) ?? [];
  const total = applications.length;
  const assessed = applications.filter(
    (a) => a.status === "assessment_complete" || a.status === "decision_made"
  ).length;
  const awaiting = applications.filter((a) => a.status === "assessment_sent").length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
          <p className="text-[color:var(--brand-ink-muted)]">
            Applications, assessments, and what needs your attention.
          </p>
        </div>
        <Link href="/admin/postings" className="btn-primary">
          + New posting
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <Stat label="Applications" value={total} />
        <Stat label="Assessments done" value={assessed} />
        <Stat label="Awaiting assessment" value={awaiting} />
        <Stat label="Open postings" value={openPostings ?? 0} />
      </div>

      <div className="card mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-lg">Recent candidates</h2>
          <Link
            href="/admin/candidates"
            className="text-sm font-semibold text-[color:var(--brand-pink-600)] hover:underline"
          >
            View all
          </Link>
        </div>
        {applications.length === 0 ? (
          <p className="text-[color:var(--brand-ink-muted)] mt-3 text-sm">
            No applications yet. Share a posting to start collecting candidates.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[color:var(--brand-line)]">
            {applications.slice(0, 10).map((a) => (
              <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                <Link
                  href={`/admin/candidates/${a.id}`}
                  className="font-semibold hover:text-[color:var(--brand-pink-600)]"
                >
                  {a.first_name} {a.last_name}
                </Link>
                <span className="text-xs text-[color:var(--brand-ink-muted)]">
                  {a.positions?.[0] ?? "—"} · {a.status.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
        {label}
      </div>
      <div className="text-3xl font-black mt-1">{value}</div>
    </div>
  );
}
