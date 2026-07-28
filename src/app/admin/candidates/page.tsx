import { notFound } from "next/navigation";
import Link from "next/link";
import { currentOrg } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import { fitByApplication } from "@/lib/assessment/fit";
import { asView, matchesSearch, CANDIDATE_VIEWS } from "@/lib/candidate-filter";
import CandidateFilters from "@/components/admin/CandidateFilters";
import type { Database } from "@/lib/supabase/database.types";
import type { OverallFit } from "@/lib/assessment/scoring";

type AppRow = Database["public"]["Tables"]["applications"]["Row"];

const STATUS: Record<string, { label: string }> = {
  new: { label: "New" },
  assessment_sent: { label: "Assessment sent" },
  assessment_complete: { label: "Assessment complete" },
  decision_made: { label: "Decision made" },
};

const DECISION: Record<string, { label: string; cls: string }> = {
  hired: { label: "Hired", cls: "bg-green-100 text-green-800" },
  not_hired: { label: "Not hired", cls: "bg-gray-200 text-gray-700" },
  declined: { label: "Declined", cls: "bg-amber-100 text-amber-800" },
};

const FIT_CLS: Record<OverallFit, string> = {
  "Strong fit": "bg-emerald-100 text-emerald-800",
  Consider: "bg-emerald-50 text-emerald-700",
  Caution: "bg-amber-100 text-amber-800",
  "Not recommended": "bg-rose-100 text-rose-700",
  Incomplete: "bg-gray-100 text-gray-500",
};

interface PageProps {
  searchParams: Promise<{ q?: string; view?: string }>;
}

export default async function CandidatesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const view = asView(sp.view);
  const q = sp.q ?? "";
  const org = await currentOrg();
  if (!org) notFound();
  const supa = adminClient();

  // Full-pipeline counts (unfiltered) for the overview cards.
  // Exclude roster-import shadow apps — they're employees, not job applicants.
  const { data: allStatus } = await supa
    .from("applications")
    .select("status")
    .eq("org_id", org.id)
    .or("source.is.null,source.neq.roster_import");
  const statusRows = (allStatus as { status: string }[] | null) ?? [];
  const counts: Record<string, number> = {
    new: 0,
    assessment_sent: 0,
    assessment_complete: 0,
    decision_made: 0,
  };
  for (const r of statusRows) counts[r.status] = (counts[r.status] ?? 0) + 1;

  // List query — the view sets the server-side stage/decision filter.
  let query = supa
    .from("applications")
    .select("*")
    .eq("org_id", org.id)
    .or("source.is.null,source.neq.roster_import")
    .order("submitted_at", { ascending: false })
    .limit(200);
  if (view === "decided") query = query.not("decision", "is", null);
  else query = query.is("decision", null); // active / new / review / strong are all open
  if (view === "new") query = query.in("status", ["new", "assessment_sent"]);
  else if (view === "review") query = query.eq("status", "assessment_complete");

  const [{ data }, fit] = await Promise.all([query, fitByApplication(org.id)]);
  let apps = (data as AppRow[] | null) ?? [];

  // "Strong fit" + free-text search are applied in memory against the computed
  // fit — the same predicate meaning as the mobile app.
  if (view === "strong") apps = apps.filter((a) => fit.get(a.id) === "Strong fit");
  if (q.trim()) {
    apps = apps.filter((a) =>
      matchesSearch(
        { firstName: a.first_name, lastName: a.last_name, email: a.email, role: a.positions?.[0] ?? "" },
        q
      )
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Candidates</h1>
      <p className="text-[color:var(--brand-ink-muted)]">
        Everyone who applied, where they are in the pipeline.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {(["new", "assessment_sent", "assessment_complete", "decision_made"] as const).map((k) => (
          <div key={k} className="card">
            <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
              {STATUS[k].label}
            </div>
            <div className="text-3xl font-black mt-1">{counts[k] ?? 0}</div>
          </div>
        ))}
      </div>

      <CandidateFilters />

      <div className="card mt-4 p-0 overflow-hidden">
        <ul className="divide-y divide-[color:var(--brand-line)]">
          {apps.length === 0 && (
            <li className="p-6 text-sm text-[color:var(--brand-ink-muted)]">
              {q.trim() || view !== "active"
                ? `No candidates in "${CANDIDATE_VIEWS.find((v) => v.key === view)?.label}"${
                    q.trim() ? " matching your search" : ""
                  }.`
                : "No applications yet. Share a posting's link or QR to start collecting candidates."}
            </li>
          )}
          {apps.map((a) => {
            const f = fit.get(a.id);
            return (
              <li key={a.id}>
                <Link
                  href={`/admin/candidates/${a.id}`}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-[color:var(--brand-cream)]"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {a.first_name} {a.last_name}
                    </div>
                    <div className="text-xs text-[color:var(--brand-ink-muted)] flex flex-wrap gap-2 mt-0.5">
                      <span>{a.positions?.[0] ?? "—"}</span>
                      <span>·</span>
                      <span>{a.email}</span>
                      <span>·</span>
                      <span>{new Date(a.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {f && <span className={`chip whitespace-nowrap ${FIT_CLS[f]}`}>{f}</span>}
                    {a.decision && DECISION[a.decision] && (
                      <span className={`chip whitespace-nowrap ${DECISION[a.decision].cls}`}>
                        {DECISION[a.decision].label}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
