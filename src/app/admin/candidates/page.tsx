import { notFound } from "next/navigation";
import Link from "next/link";
import { currentOrg } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type AppRow = Database["public"]["Tables"]["applications"]["Row"];

const STATUS: Record<string, { label: string }> = {
  new: { label: "New" },
  assessment_sent: { label: "Assessment sent" },
  assessment_complete: { label: "Assessment complete" },
  decision_made: { label: "Decision made" },
};

export default async function CandidatesPage() {
  const org = await currentOrg();
  if (!org) notFound();

  const supa = adminClient();
  const { data } = await supa
    .from("applications")
    .select("*")
    .eq("org_id", org.id)
    .order("submitted_at", { ascending: false })
    .limit(200);
  const apps = (data as AppRow[] | null) ?? [];

  const counts = {
    new: 0,
    assessment_sent: 0,
    assessment_complete: 0,
    decision_made: 0,
  } as Record<string, number>;
  for (const a of apps) counts[a.status] = (counts[a.status] ?? 0) + 1;

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Candidates</h1>
      <p className="text-[color:var(--brand-ink-muted)]">
        Everyone who applied, where they are in the pipeline.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {(["new", "assessment_sent", "assessment_complete", "decision_made"] as const).map(
          (k) => (
            <div key={k} className="card">
              <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
                {STATUS[k].label}
              </div>
              <div className="text-3xl font-black mt-1">{counts[k] ?? 0}</div>
            </div>
          )
        )}
      </div>

      <div className="card mt-6 p-0 overflow-hidden">
        <ul className="divide-y divide-[color:var(--brand-line)]">
          {apps.length === 0 && (
            <li className="p-6 text-sm text-[color:var(--brand-ink-muted)]">
              No applications yet. Share a posting&apos;s link or QR to start
              collecting candidates.
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
                <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)] whitespace-nowrap">
                  {STATUS[a.status]?.label ?? a.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
