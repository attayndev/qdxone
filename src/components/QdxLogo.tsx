/**
 * QDXone brand mark + wordmark.
 *
 * The mark is three ascending rounded bars — slate, mid-blue, amber — a tiny
 * bar chart that carries the brand idea ("score, don't filter"); the amber
 * "high" bar is the only accent. Colors come from the `--brand-*` CSS vars so
 * the mark re-themes with the rest of the site.
 */

export function QdxMark({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 34 24"
      className={className}
      role="img"
      aria-label="QDXone"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="13" width="8" height="11" rx="4" fill="var(--brand-slate)" />
      <rect x="13" y="6" width="8" height="18" rx="4" fill="var(--brand-blue)" />
      <rect x="26" y="0" width="8" height="24" rx="4" fill="var(--brand-amber)" />
    </svg>
  );
}

/**
 * Full wordmark: mark + "QDX" (ink) + "one" (mid-blue). `size` controls the
 * text scale; the mark height tracks it.
 */
export function QdxWordmark({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const textCls = size === "sm" ? "text-xl" : "text-2xl";
  const markCls = size === "sm" ? "h-5 w-auto" : "h-6 w-auto";
  return (
    <span className={"inline-flex items-center gap-2 " + className}>
      <QdxMark className={markCls} />
      <span className={`font-black tracking-tight leading-none ${textCls}`}>
        <span className="text-[color:var(--brand-ink)]">QDX</span>
        <span className="text-[color:var(--brand-blue)]">one</span>
      </span>
    </span>
  );
}
