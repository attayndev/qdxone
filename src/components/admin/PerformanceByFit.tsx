import { analyzePerformanceByFit } from "@/lib/employee-analytics";
import type { FitBand } from "@/lib/employee-analytics-core";

const BAND_TONE: Record<FitBand, string> = {
  "Strong fit": "bg-emerald-500",
  Consider: "bg-emerald-300",
  Caution: "bg-amber-400",
  "Not recommended": "bg-rose-500",
};

/**
 * "Does the assessment predict performance?" — each fit band's hired count,
 * average performance rating, and retention. Honest about thin data: sample
 * sizes are always shown, and averages from fewer than 3 reviewed employees are
 * withheld as "too few to read yet" rather than printed as if precise.
 */
export default async function PerformanceByFit({ orgId }: { orgId: string }) {
  const r = await analyzePerformanceByFit(orgId);

  return (
    <div className="card mt-6">
      <h2 className="font-extrabold text-lg">
        Does the assessment predict performance?
      </h2>
      <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
        How each fit band&apos;s hires are actually performing and whether they
        stayed. This fills in as you complete reviews — it needs a few cycles and
        enough hires per band before the numbers mean much.
      </p>

      {r.totalReviewed === 0 ? (
        <p className="text-sm text-[color:var(--brand-ink-muted)] mt-4 rounded-lg bg-[color:var(--brand-cream)] p-4">
          No performance reviews yet. Once you start rating employees, you&apos;ll
          see whether higher-scored candidates rate higher and stay longer.
          {r.totalHired > 0 && ` (${r.totalHired} hired, waiting on first reviews.)`}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {r.bands.map((b) => (
            <li
              key={b.band}
              className="grid grid-cols-1 sm:grid-cols-[1.2fr_1.6fr_auto] gap-2 sm:gap-4 sm:items-center"
            >
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded ${BAND_TONE[b.band]}`} />
                <span className="font-semibold">{b.band}</span>
                <span className="text-xs text-[color:var(--brand-ink-muted)]">
                  {b.hired} hired · {b.reviewed} reviewed
                </span>
              </div>

              <div>
                {b.reviewed === 0 ? (
                  <span className="text-sm text-[color:var(--brand-ink-muted)]">
                    No reviews yet
                  </span>
                ) : !b.readable ? (
                  <span className="text-sm text-[color:var(--brand-ink-muted)]">
                    Too few to read yet
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 rounded-full bg-[color:var(--brand-line)] overflow-hidden min-w-[80px]">
                      <div
                        className={BAND_TONE[b.band]}
                        style={{ width: `${((b.avgRating ?? 0) / 5) * 100}%`, height: "100%" }}
                      />
                    </div>
                    <span className="font-mono text-sm whitespace-nowrap">
                      {b.avgRating!.toFixed(1)}/5
                    </span>
                  </div>
                )}
              </div>

              <div className="text-sm text-right whitespace-nowrap">
                {b.retentionPct == null ? (
                  <span className="text-[color:var(--brand-ink-muted)]">—</span>
                ) : (
                  <span className="text-[color:var(--brand-ink-muted)]">
                    {Math.round(b.retentionPct)}% still here
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {r.untrackedFit > 0 && (
        <p className="text-xs text-[color:var(--brand-ink-muted)] mt-4">
          {r.untrackedFit} employee{r.untrackedFit === 1 ? "" : "s"} not shown
          (no linked assessment or an incomplete score).
        </p>
      )}
    </div>
  );
}
