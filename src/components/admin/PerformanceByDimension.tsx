import { analyzePerformanceByDimension } from "@/lib/employee-analytics";
import type { AssessBand } from "@/lib/employee-analytics-core";

const BAND_TONE: Record<AssessBand, string> = {
  High: "bg-emerald-500",
  Mid: "bg-amber-400",
  Low: "bg-rose-400",
};
const BAND_LABEL: Record<AssessBand, string> = {
  High: "Assessed high",
  Mid: "Assessed mid",
  Low: "Assessed low",
};

/**
 * Per-dimension validation: for each of the four assessment dimensions, whether
 * a higher ASSESSMENT band predicts a higher on-the-job rating on that same
 * dimension. The sharpest read on which parts of the assessment actually work.
 */
export default async function PerformanceByDimension({ orgId }: { orgId: string }) {
  const dims = await analyzePerformanceByDimension(orgId);
  const anyData = dims.some((d) => d.totalRated > 0);

  return (
    <div className="card mt-6">
      <h2 className="font-extrabold text-lg">Assessment accuracy by dimension</h2>
      <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
        For each thing the assessment measures, whether the people it scored
        higher actually perform better on that same thing at work. Same honesty:
        a band with fewer than 3 rated employees reads &ldquo;too few yet.&rdquo;
      </p>

      {!anyData ? (
        <p className="text-sm text-[color:var(--brand-ink-muted)] mt-4 rounded-lg bg-[color:var(--brand-cream)] p-4">
          No dimension ratings yet. As you rate employees on Reliability, People
          Skills, Composure, and Ownership, each dimension&apos;s accuracy shows
          here.
        </p>
      ) : (
        <div className="mt-4 grid sm:grid-cols-2 gap-5">
          {dims.map((d) => (
            <div key={d.academic}>
              <div className="font-bold text-sm">{d.label}</div>
              <ul className="mt-2 space-y-1.5">
                {d.bands.map((b) => (
                  <li key={b.band} className="flex items-center gap-2 text-sm">
                    <span className="w-24 shrink-0 text-[color:var(--brand-ink-muted)] text-xs">
                      {BAND_LABEL[b.band]}
                    </span>
                    <div className="flex-1 h-3 rounded-full bg-[color:var(--brand-line)] overflow-hidden min-w-[50px]">
                      {b.avgRating != null && b.readable && (
                        <div
                          className={BAND_TONE[b.band]}
                          style={{ width: `${(b.avgRating / 5) * 100}%`, height: "100%" }}
                        />
                      )}
                    </div>
                    <span className="w-28 shrink-0 text-right text-xs font-mono">
                      {b.rated === 0 ? (
                        <span className="text-[color:var(--brand-ink-muted)]">no ratings</span>
                      ) : !b.readable ? (
                        <span className="text-[color:var(--brand-ink-muted)]">too few yet</span>
                      ) : (
                        `${b.avgRating!.toFixed(1)}/5 · n=${b.rated}`
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
