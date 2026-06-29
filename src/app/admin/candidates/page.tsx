import { notFound } from "next/navigation";
import Link from "next/link";
import { currentOrg } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import CandidateFilters from "@/components/admin/CandidateFilters";
import type { Database } from "@/lib/supabase/database.types";

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

interface PageProps {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    decision?: string;
    show?: string;
  }>;
}

export default async function CandidatesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const org = await currentOrg();
  if (!org) notFound();
  const supa = adminClient();

  // Full-pipeline counts (unfiltered) for the cards + how many are decided.
  const { data: allStatus } = await supa
    .from("applications")
    .select("status, decision")
    .eq("org_id", org.id);
  const statusRows = (allStatus as { status: string; decision: string | null }[] | null) ?? [];
  const counts: Record<string, number> = {
    new: 0,
    assessment_sent: 0,
    assessment_complete: 0,
    decision_made: 0,
  };
  for (const r of statusRows) counts[r.status] = (counts[r.status] ?? 0) + 1;
  const decidedCount = statusRows.filter((r) => r.decision).length;

  // Filtered list.
  let query = supa
    .from("applications")
    .select("*")
    .eq("org_id", org.id)
    .order("submitted_at", { ascending: false })
    .limit(200);
  if (sp.decision) query = query.eq("decision", sp.decision);
  else if (sp.show !== "all") query = query.is("decision", null); // hide decided by default
  if (sp.status) query = query.eq("status", sp.status as AppRow["status"]);
  if (sp.role) query = query.contains("positions", [sp.role]);
  if (sp.q) {
    const t = sp.q.replace(/[%,()]/g, "").trim();
    if (t) query = query.or(`first_name.ilike.%${t}%,last_name.ilike.%${t}%,email.ilike.%${t}%`);
  }
  const { data } = await query;
  const apps = (data as AppRow[] | null) ?? [];

  const roles = (org.branding?.roles ?? []) as string[];
  const filtersActive = !!(sp.q || sp.role || sp.status || sp.decision);
  const hidingDecided = !sp.decision && sp.show !== "all" && decidedCount > 0;

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

      <CandidateFilters roles={roles} />

      {hidingDecided && (
        <p className="text-xs text-[color:var(--brand-ink-muted)] mt-2">
          {decidedCount} decided candidate{decidedCount === 1 ? "" : "s"} hidden — tick
          &ldquo;Include decided&rdquo; to show them.
        </p>
      )}

      <div className="card mt-4 p-0 overflow-hidden">
        <ul className="divide-y divide-[color:var(--brand-line)]">
          {apps.length === 0 && (
            <li className="p-6 text-sm text-[color:var(--brand-ink-muted)]">
              {filtersActive || hidingDecided
                ? "No candidates match these filters."
                : "No applications yet. Share a posting's link or QR to start collecting candidates."}
            </li>
          )}
          {apps.map((a) => (
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
                  {a.decision && DECISION[a.decision] && (
                    <span className={`chip whitespace-nowrap ${DECISION[a.decision].cls}`}>
                      {DECISION[a.decision].label}
                    </span>
                  )}
                  <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)] whitespace-nowrap">
                    {STATUS[a.status]?.label ?? a.status}
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
