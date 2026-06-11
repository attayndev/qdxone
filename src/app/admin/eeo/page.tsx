import { notFound } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import { computeOrgFairness } from "@/lib/eeo-reporting";

export default async function FairnessPage() {
  const org = await currentOrg();
  if (!org) notFound();
  const report = await computeOrgFairness(org.id);

  const hasVisible = report.dimensions.some((d) =>
    d.groups.some((g) => !g.suppressed)
  );

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Fairness & EEO</h1>
      <p className="text-[color:var(--brand-ink-muted)] max-w-2xl">
        Aggregate hiring-fairness reporting. Individual EEO responses are stored
        separately and are never shown here — only group totals, with small
        groups hidden for privacy.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
        <Stat label="EEO respondents" value={report.respondents} />
        <Stat label="Preferred not to answer" value={report.declined} />
        <Stat label="Assessments scored" value={report.scored} />
      </div>

      {!hasVisible ? (
        <div className="card mt-6">
          <p className="text-[color:var(--brand-ink-muted)]">
            Not enough data yet to report. Groups are only shown once at least
            5 candidates have self-identified and completed the assessment — so
            no individual can be identified. Keep collecting applications and
            this fills in.
          </p>
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          <p className="text-sm text-[color:var(--brand-ink-muted)]">
            <strong>Favorable</strong> = assessment recommendation of Strong fit
            or Consider. A ⚠ flag marks any group whose favorable rate is below
            80% of the highest group&apos;s (the four-fifths rule) — a signal to
            review, not a verdict.
          </p>
          {report.dimensions.map((d) => (
            <DimensionTable key={d.key} dimension={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function DimensionTable({
  dimension,
}: {
  dimension: Awaited<ReturnType<typeof computeOrgFairness>>["dimensions"][number];
}) {
  const visible = dimension.groups.filter((g) => !g.suppressed);
  const suppressed = dimension.groups.filter((g) => g.suppressed);
  if (visible.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-extrabold text-lg">{dimension.label}</h2>
        {dimension.anyFlagged && (
          <span className="chip bg-rose-100 text-rose-700">Review flagged</span>
        )}
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[color:var(--brand-ink-muted)]">
              <th className="py-1 font-semibold">Group</th>
              <th className="py-1 font-semibold text-right">Candidates</th>
              <th className="py-1 font-semibold text-right">Favorable</th>
              <th className="py-1 font-semibold text-right">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--brand-line)]">
            {visible.map((g) => (
              <tr key={g.value} className={g.flagged ? "text-rose-700" : ""}>
                <td className="py-2">
                  {g.flagged && "⚠ "}
                  {g.label}
                </td>
                <td className="py-2 text-right font-mono">{g.n}</td>
                <td className="py-2 text-right font-mono">{g.favorable}</td>
                <td className="py-2 text-right font-mono">
                  {g.favorableRate == null
                    ? "—"
                    : `${Math.round(g.favorableRate * 100)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {suppressed.length > 0 && (
        <p className="mt-2 text-xs text-[color:var(--brand-ink-muted)]">
          {suppressed.length} group{suppressed.length > 1 ? "s" : ""} hidden
          (fewer than 5 candidates).
        </p>
      )}
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
