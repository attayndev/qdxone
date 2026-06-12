import { notFound } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import { computeOrgReport } from "@/lib/reports";
import type { OverallFit } from "@/lib/assessment/scoring";

const TIER_ORDER: OverallFit[] = ["Strong fit", "Consider", "Caution", "Not recommended"];
const TIER_TONE: Record<string, string> = {
  "Strong fit": "bg-emerald-500",
  Consider: "bg-emerald-300",
  Caution: "bg-amber-400",
  "Not recommended": "bg-rose-500",
};

export default async function ReportsPage() {
  const org = await currentOrg();
  if (!org) notFound();
  const r = await computeOrgReport(org.id);

  const tierTotal = TIER_ORDER.reduce((s, t) => s + r.tierCounts[t], 0);

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Reports</h1>
      <p className="text-[color:var(--brand-ink-muted)]">
        Your hiring funnel and assessment outcomes.
      </p>

      {/* Funnel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <Stat label="Applied" value={r.funnel.applied} />
        <Stat
          label="Assessment sent"
          value={r.funnel.assessmentSent}
          sub={pct(r.funnel.assessmentSent, r.funnel.applied)}
        />
        <Stat
          label="Completed"
          value={r.funnel.assessmentComplete}
          sub={
            r.completionRate == null
              ? undefined
              : `${Math.round(r.completionRate * 100)}% of sent`
          }
        />
        <Stat label="Decision made" value={r.funnel.decided} />
      </div>

      {/* Recommendation distribution */}
      <div className="card mt-6">
        <h2 className="font-extrabold text-lg">Recommendation mix</h2>
        {tierTotal === 0 ? (
          <p className="text-sm text-[color:var(--brand-ink-muted)] mt-2">
            No scored assessments yet.
          </p>
        ) : (
          <>
            <div className="mt-4 flex h-4 rounded-full overflow-hidden">
              {TIER_ORDER.map((t) =>
                r.tierCounts[t] > 0 ? (
                  <div
                    key={t}
                    className={TIER_TONE[t]}
                    style={{ width: `${(r.tierCounts[t] / tierTotal) * 100}%` }}
                    title={`${t}: ${r.tierCounts[t]}`}
                  />
                ) : null
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              {TIER_ORDER.map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded ${TIER_TONE[t]}`} />
                  <span className="text-[color:var(--brand-ink-muted)]">{t}</span>
                  <span className="font-mono ml-auto">{r.tierCounts[t]}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* By role */}
      <div className="card mt-6">
        <h2 className="font-extrabold text-lg">Applications by role</h2>
        {r.byRole.length === 0 ? (
          <p className="text-sm text-[color:var(--brand-ink-muted)] mt-2">
            No applications yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[color:var(--brand-line)]">
            {r.byRole.map((row) => (
              <li key={row.role} className="py-2 flex items-center justify-between">
                <span>{row.role}</span>
                <span className="font-mono">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function pct(n: number, of: number): string | undefined {
  if (!of) return undefined;
  return `${Math.round((n / of) * 100)}% of applied`;
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
        {label}
      </div>
      <div className="text-3xl font-black mt-1">{value}</div>
      {sub && <div className="text-xs text-[color:var(--brand-ink-muted)] mt-1">{sub}</div>}
    </div>
  );
}
