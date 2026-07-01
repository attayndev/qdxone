/**
 * The demo strip — shown at the very top of EVERY demo.qdx.one page (rendered
 * from the root layout when the org slug is "demo"). Each link routes through
 * /api/demo/enter, which signs the visitor in as the shared demo user and drops
 * them into that admin section — so it works whether they're on the public
 * landing or already inside the dashboard.
 */
const LINKS = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/candidates", label: "Candidates" },
  { to: "/admin/postings", label: "Jobs" },
  { to: "/admin/roles", label: "Roles" },
  { to: "/admin/scheduling", label: "Interviews" },
];

export function DemoBar() {
  return (
    // `demo-bar` marker + sticky: floats at the top; globals.css offsets the
    // page's own sticky header below it. Fixed height so that offset is exact;
    // scrolls horizontally on narrow screens instead of wrapping.
    <div className="demo-bar sticky top-0 z-50 bg-[color:var(--brand-ink)] text-white text-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-10 flex items-center gap-4 overflow-x-auto whitespace-nowrap">
        <span className="font-semibold shrink-0">🔍 Live demo:</span>
        <nav className="flex items-center gap-4 shrink-0">
          {LINKS.map((l) => (
            <a
              key={l.to}
              href={`/api/demo/enter?to=${encodeURIComponent(l.to)}`}
              className="font-semibold underline decoration-white/40 hover:decoration-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
