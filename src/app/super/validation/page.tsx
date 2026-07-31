import { platformContext } from "@/lib/super/guard";
import { adminClient } from "@/lib/supabase/admin";
import { SuperNav } from "@/components/super/SuperNav";
import { SuperLogin } from "@/components/super/SuperLogin";
import { instrumentReliability, type VersionReliability } from "@/lib/validation/reliability";
import { coverageStats } from "@/lib/validation/coverage";
import { analyzePerformanceByFit, analyzePerformanceByDimension } from "@/lib/employee-analytics";
import type { PerformanceByFit, DimensionPerformance } from "@/lib/employee-analytics-core";
import { MIN_CELL } from "@/lib/eeo-reporting";

// The only pilot org — nothing to pool across tenants yet (spec §4c).
const PILOT_SLUG = "16handlesnewcity";

/**
 * Internal, platform-admin-only research view (spec §4a + §4c). Never
 * candidate-facing, never linked from any customer-facing surface.
 */
export default async function ValidationPage() {
  const { user, isAdmin } = await platformContext();
  if (!isAdmin) return <SuperLogin signedInEmail={user?.email ?? null} />;

  const admin = adminClient();
  const { data: pilotOrg } = await admin
    .from("organizations")
    .select("id, name")
    .eq("slug", PILOT_SLUG)
    .maybeSingle();

  const [platformCoverage, pilotCoverage, reliability, fitPerf, dimPerf] = await Promise.all([
    coverageStats(),
    pilotOrg ? coverageStats(pilotOrg.id) : Promise.resolve(null),
    instrumentReliability(),
    pilotOrg ? analyzePerformanceByFit(pilotOrg.id) : Promise.resolve(null),
    pilotOrg ? analyzePerformanceByDimension(pilotOrg.id) : Promise.resolve(null),
  ]);

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 bg-[color:var(--brand-cream)]">
      <div className="max-w-6xl mx-auto">
        <SuperNav active="validation" />

        {/* §1 Coverage / n-growth */}
        <section className="mt-2">
          <PreliminaryBanner />
          <h2 className="font-extrabold text-xl mt-4">Coverage / n-growth</h2>
          <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1 max-w-2xl">
            The number that has to grow before any of the analytics below are actionable:
            employees who are BOTH assessed (a complete assessment tied to their hiring
            application) AND reviewed (at least one rated performance review).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <Stat label="Platform-wide: assessed + reviewed" value={platformCoverage.assessedAndReviewed} />
            <Stat label="Platform-wide employees" value={platformCoverage.employees} />
            <Stat
              label={pilotOrg ? `Pilot (${pilotOrg.name}): assessed + reviewed` : "Pilot org not found"}
              value={pilotCoverage?.assessedAndReviewed ?? "—"}
            />
            <Stat label="Pilot employees" value={pilotCoverage?.employees ?? "—"} />
          </div>
        </section>

        {/* §2 Instrument reliability (§4a) */}
        <section className="mt-10">
          <PreliminaryBanner />
          <h2 className="font-extrabold text-xl mt-4">Instrument reliability</h2>
          <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1 max-w-2xl">
            Needs zero outcome data — pooled across all orgs, since reliability is a property
            of the instrument version, not any one tenant. <strong>The assessment administers a
            rotating subset of each facet&apos;s items per session</strong>, so classical
            complete-case Cronbach&apos;s α isn&apos;t computable (almost nobody answers every
            item in a facet — a covariance/IRT reliability is an I/O-psychologist analysis).
            The design-robust signal is the <strong>available-case corrected item-total
            correlation</strong>: each item vs. the mean of the respondent&apos;s other answered
            facet items. A low or negative value (flagged &lt;0.20) marks an item that
            doesn&apos;t cohere with its facet — a candidate to review or prune.
          </p>
          {reliability.length === 0 ? (
            <div className="card mt-4">
              <p className="text-sm text-[color:var(--brand-ink-muted)]">
                No complete assessment sessions yet.
              </p>
            </div>
          ) : (
            reliability.map((v) => <ReliabilityTable key={v.version} version={v} />)
          )}
        </section>

        {/* §3 Directional criterion signal (§4c) */}
        <section className="mt-10">
          <PreliminaryBanner />
          <h2 className="font-extrabold text-xl mt-4">
            Directional criterion signal{pilotOrg ? ` — ${pilotOrg.name}` : ""}
          </h2>
          <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1 max-w-2xl">
            Does the assessment predict on-the-job performance? Single-tenant (the pilot
            only), n far too small to be evidentiary. Any cell with fewer than {MIN_CELL}{" "}
            respondents is suppressed as a re-identification control.
          </p>
          {!pilotOrg || !fitPerf || !dimPerf ? (
            <div className="card mt-4">
              <p className="text-sm text-[color:var(--brand-ink-muted)]">Pilot org not found.</p>
            </div>
          ) : (
            <>
              <FitTable perf={fitPerf} />
              <DimensionTables dims={dimPerf} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function PreliminaryBanner() {
  return (
    <div className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
      PRELIMINARY — internal research; n far below actionable; directional only, never used
      to score candidates
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
        {label}
      </div>
      <div className="text-3xl font-black mt-1">{value}</div>
    </div>
  );
}

function ReliabilityTable({ version }: { version: VersionReliability }) {
  return (
    <div className="card mt-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-bold">{version.version}</h3>
        <span className="text-xs text-[color:var(--brand-ink-muted)]">
          n = {version.nSessions} complete session{version.nSessions === 1 ? "" : "s"}
        </span>
      </div>
      {version.facets.length === 0 ? (
        <p className="text-sm text-[color:var(--brand-ink-muted)] mt-3">
          No facet has ≥2 items and ≥2 respondents yet.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[color:var(--brand-ink-muted)]">
                <th className="py-1 font-semibold">Facet</th>
                <th className="py-1 font-semibold text-right">Items</th>
                <th className="py-1 font-semibold text-right">Respondents</th>
                <th className="py-1 font-semibold text-right">Median item-total r</th>
                <th className="py-1 font-semibold text-right">α</th>
                <th className="py-1 font-semibold">Weak items (r&lt;0.20)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--brand-line)]">
              {version.facets.map((f) => {
                const lowCoherence = f.medianItemTotal != null && f.medianItemTotal < 0.3;
                return (
                  <tr key={f.facet} className={lowCoherence ? "text-rose-700" : ""}>
                    <td className="py-2">
                      {lowCoherence && "⚠ "}
                      {f.facet}
                      <span className="block text-xs text-[color:var(--brand-ink-muted)] font-normal">
                        {f.categoryUi}
                      </span>
                    </td>
                    <td className="py-2 text-right font-mono">{f.nItems}</td>
                    <td className="py-2 text-right font-mono">{f.nRespondents}</td>
                    <td className="py-2 text-right font-mono">
                      {f.medianItemTotal == null ? "—" : f.medianItemTotal.toFixed(2)}
                    </td>
                    <td className="py-2 text-right font-mono text-[color:var(--brand-ink-muted)]" title={f.alphaNote ?? undefined}>
                      {f.alpha == null ? "n/a" : f.alpha.toFixed(2)}
                    </td>
                    <td className="py-2 text-xs">
                      {f.weakItems.length ? f.weakItems.join(", ") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-[color:var(--brand-ink-muted)] mt-2">
            α = &ldquo;n/a&rdquo; under the rotating-form design (hover for detail). Median item-total
            &lt;0.30 (⚠) suggests the facet&apos;s items cohere weakly — but read directionally at this n.
          </p>
        </div>
      )}
    </div>
  );
}

function FitTable({ perf }: { perf: PerformanceByFit }) {
  return (
    <div className="card mt-4">
      <h3 className="font-bold">Fit band vs. performance</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[color:var(--brand-ink-muted)]">
              <th className="py-1 font-semibold">Band</th>
              <th className="py-1 font-semibold text-right">Hired (n)</th>
              <th className="py-1 font-semibold text-right">Reviewed (n)</th>
              <th className="py-1 font-semibold text-right">Avg rating</th>
              <th className="py-1 font-semibold text-right">Retention</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--brand-line)]">
            {perf.bands.map((b) => {
              const ratingSuppressed = b.reviewed < MIN_CELL;
              const retentionSuppressed = b.hired < MIN_CELL;
              return (
                <tr key={b.band}>
                  <td className="py-2">{b.band}</td>
                  <td className="py-2 text-right font-mono">{b.hired}</td>
                  <td className="py-2 text-right font-mono">{b.reviewed}</td>
                  <td className="py-2 text-right font-mono">
                    {ratingSuppressed
                      ? `suppressed (n<${MIN_CELL})`
                      : b.avgRating == null
                        ? "—"
                        : `${b.avgRating.toFixed(1)}/5`}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {retentionSuppressed
                      ? `suppressed (n<${MIN_CELL})`
                      : b.retentionPct == null
                        ? "—"
                        : `${Math.round(b.retentionPct)}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {perf.untrackedFit > 0 && (
        <p className="text-xs text-[color:var(--brand-ink-muted)] mt-2">
          {perf.untrackedFit} employee{perf.untrackedFit === 1 ? "" : "s"} not shown (no
          linked assessment or an incomplete score).
        </p>
      )}
    </div>
  );
}

function DimensionTables({ dims }: { dims: DimensionPerformance[] }) {
  return (
    <div className="card mt-4">
      <h3 className="font-bold">Assessment band vs. performance, by dimension</h3>
      <div className="mt-3 grid sm:grid-cols-2 gap-6">
        {dims.map((d) => (
          <div key={d.academic}>
            <div className="font-bold text-sm">{d.label}</div>
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="text-left text-[color:var(--brand-ink-muted)]">
                  <th className="py-1 font-semibold">Band</th>
                  <th className="py-1 font-semibold text-right">Count</th>
                  <th className="py-1 font-semibold text-right">Rated (n)</th>
                  <th className="py-1 font-semibold text-right">Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--brand-line)]">
                {d.bands.map((b) => {
                  const suppressed = b.rated < MIN_CELL;
                  return (
                    <tr key={b.band}>
                      <td className="py-1.5">{b.band}</td>
                      <td className="py-1.5 text-right font-mono">{b.count}</td>
                      <td className="py-1.5 text-right font-mono">{b.rated}</td>
                      <td className="py-1.5 text-right font-mono">
                        {suppressed
                          ? `suppressed (n<${MIN_CELL})`
                          : b.avgRating == null
                            ? "—"
                            : `${b.avgRating.toFixed(1)}/5`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
