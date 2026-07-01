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
    <div className="bg-[color:var(--brand-ink)] text-white text-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-x-4 gap-y-1 flex-wrap">
        <span className="font-semibold">🔍 Live demo — explore the operator dashboard:</span>
        <nav className="flex items-center gap-4 flex-wrap">
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
