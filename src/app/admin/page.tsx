import { notFound } from "next/navigation";
import Link from "next/link";
import { currentOrg, orgUrl } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import { getOnboarding } from "@/lib/onboarding";
import { fitByApplication } from "@/lib/assessment/fit";
import { asView, matchesView, matchesSearch, CANDIDATE_VIEWS } from "@/lib/candidate-filter";
import OnboardingGuide from "@/components/admin/onboarding/OnboardingGuide";
import CandidateFilters from "@/components/admin/CandidateFilters";
import type { Database } from "@/lib/supabase/database.types";

type AppRow = Database["public"]["Tables"]["applications"]["Row"];

interface PageProps {
  searchParams: Promise<{ view?: string; q?: string }>;
}

export default async function AdminDashboard({ searchParams }: PageProps) {
  const sp = await searchParams;
  const view = asView(sp.view); // defaults to "active" — decided candidates are hidden
  const q = sp.q ?? "";
  const org = await currentOrg();
  if (!org) notFound();
  const supa = adminClient();

  const { status: onboarding, locations: onboardingLocations } =
    await getOnboarding(org);

  const [{ data: apps }, { count: openPostings }, fit] = await Promise.all([
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
    fitByApplication(org.id),
  ]);

  const applications = (apps as AppRow[] | null) ?? [];
  const total = applications.length;
  const assessed = applications.filter(
    (a) => a.status === "assessment_complete" || a.status === "decision_made"
  ).length;
  const awaiting = applications.filter((a) => a.status === "assessment_sent").length;

  // The dashboard list defaults to Active (decided candidates hidden) and is
  // filterable with the same view chips as the full Candidates page.
  const visible = applications
    .filter((a) =>
      matchesView({ status: a.status, decision: a.decision, fit: fit.get(a.id) ?? null }, view)
    )
    .filter((a) =>
      matchesSearch(
        { firstName: a.first_name, lastName: a.last_name, email: a.email, role: a.positions?.[0] ?? "" },
        q
      )
    );
  const viewLabel = CANDIDATE_VIEWS.find((v) => v.key === view)?.label ?? "Active";

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

      <div className="mt-6">
        <OnboardingGuide
          status={onboarding}
          locations={onboardingLocations}
          roles={org.branding.roles ?? []}
          branding={org.branding}
          careersUrl={orgUrl(org.slug)}
          orgName={org.name}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <Stat label="Applications" value={total} />
        <Stat label="Assessments done" value={assessed} />
        <Stat label="Awaiting assessment" value={awaiting} />
        <Stat label="Open postings" value={openPostings ?? 0} />
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-extrabold text-lg">Candidates</h2>
        <Link
          href="/admin/candidates"
          className="text-sm font-semibold text-[color:var(--brand-blue-600)] hover:underline"
        >
          View all
        </Link>
      </div>
      <CandidateFilters basePath="/admin" />

      <div className="card mt-4">
        {visible.length === 0 ? (
          <p className="text-[color:var(--brand-ink-muted)] text-sm">
            {applications.length === 0
              ? "No applications yet. Share a posting to start collecting candidates."
              : `No candidates in "${viewLabel}"${q.trim() ? " matching your search" : ""}.`}
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--brand-line)]">
            {visible.slice(0, 10).map((a) => {
              const f = fit.get(a.id);
              return (
                <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <Link
                    href={`/admin/candidates/${a.id}`}
                    className="font-semibold hover:text-[color:var(--brand-blue-600)] min-w-0 truncate"
                  >
                    {a.first_name} {a.last_name}
                  </Link>
                  <span className="text-xs text-[color:var(--brand-ink-muted)] flex items-center gap-2 shrink-0">
                    <span>{a.positions?.[0] ?? "—"}</span>
                    {f && (
                      <span className="chip bg-[color:var(--brand-soft)] text-[color:var(--brand-blue-600)] whitespace-nowrap">
                        {f}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
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
