"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

/**
 * Persistent admin navigation. A fixed left rail on desktop, an off-canvas
 * drawer on mobile. Grouped by job-to-be-done so ~15 destinations stay scannable.
 */
interface NavItem { href: string; label: string; icon: keyof typeof ICONS }
interface NavGroup { group: string; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    group: "Hiring",
    items: [
      { href: "/admin", label: "Dashboard", icon: "dashboard" },
      { href: "/admin/candidates", label: "Candidates", icon: "candidates" },
      { href: "/admin/postings", label: "Postings", icon: "postings" },
      { href: "/admin/interviews", label: "Interviews", icon: "interviews" },
    ],
  },
  {
    group: "Workforce",
    items: [
      { href: "/admin/employees", label: "Employees", icon: "employees" },
      { href: "/admin/schedule", label: "Schedule", icon: "schedule" },
      { href: "/admin/roles", label: "Roles", icon: "roles" },
    ],
  },
  {
    group: "Insights",
    items: [
      { href: "/admin/reports", label: "Reports", icon: "reports" },
      { href: "/admin/eeo", label: "Fairness", icon: "fairness" },
    ],
  },
  {
    group: "Settings",
    items: [
      { href: "/admin/locations", label: "Store", icon: "store" },
      { href: "/admin/settings", label: "Page & branding", icon: "branding" },
      { href: "/admin/team", label: "Team", icon: "team" },
      { href: "/admin/scheduling", label: "Calendar setup", icon: "calendar" },
      { href: "/admin/notifications", label: "Notifications", icon: "bell" },
      { href: "/admin/billing", label: "Billing", icon: "billing" },
    ],
  },
];

export default function AdminSidebar({
  brand,
  userEmail,
  logout,
}: {
  brand: ReactNode;
  userEmail?: string;
  logout: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]); // close drawer on navigate

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
      {NAV.map((g) => (
        <div key={g.group}>
          <div className="px-3 mb-1 text-[11px] font-bold uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
            {g.group}
          </div>
          <div className="space-y-0.5">
            {g.items.map((it) => {
              const active = isActive(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className={
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors " +
                    (active
                      ? "bg-[color:var(--brand-soft)] text-[color:var(--brand-blue-600)]"
                      : "text-[color:var(--brand-ink)] hover:bg-[color:var(--brand-cream)]")
                  }
                  aria-current={active ? "page" : undefined}
                >
                  <span className={active ? "text-[color:var(--brand-blue-600)]" : "text-[color:var(--brand-ink-muted)]"}>
                    {ICONS[it.icon]}
                  </span>
                  {it.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-[color:var(--brand-line)] p-3">
      {userEmail && (
        <div className="px-3 pb-2 text-xs text-[color:var(--brand-ink-muted)] truncate">{userEmail}</div>
      )}
      <div className="px-1">{logout}</div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 border-b border-[color:var(--brand-line)] bg-white">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-2 -ml-2 rounded-lg hover:bg-[color:var(--brand-cream)]"
        >
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="min-w-0">{brand}</div>
      </div>

      {/* Desktop rail */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:h-screen md:sticky md:top-0 border-r border-[color:var(--brand-line)] bg-[color:var(--brand-surface)]">
        <div className="px-4 py-4 border-b border-[color:var(--brand-line)]">{brand}</div>
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)}>
          <aside
            className="w-72 max-w-[85%] h-full flex flex-col bg-[color:var(--brand-surface)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-4 border-b border-[color:var(--brand-line)] flex items-center justify-between gap-2">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-2 rounded-lg hover:bg-[color:var(--brand-cream)]"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}
    </>
  );
}

const S = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const ICONS = {
  dashboard: (<svg {...S}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>),
  candidates: (<svg {...S}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><path d="M16 8h5M16 12h4" /></svg>),
  postings: (<svg {...S}><path d="M3 11l16-6v13L3 13z" /><path d="M7 12v5" /></svg>),
  interviews: (<svg {...S}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /><path d="M9 15l2 2 4-4" /></svg>),
  employees: (<svg {...S}><circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" /></svg>),
  schedule: (<svg {...S}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M8 13h3M13 13h3M8 17h3M13 17h3" /></svg>),
  roles: (<svg {...S}><path d="M20 12l-8 8-9-9V3h8z" /><circle cx="7.5" cy="7.5" r="1.3" /></svg>),
  reports: (<svg {...S}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>),
  fairness: (<svg {...S}><path d="M12 3v18M5 21h14M12 6l-6 2 3 6a3 3 0 01-6 0l3-6M12 6l6 2-3 6a3 3 0 006 0l-3-6" /></svg>),
  store: (<svg {...S}><path d="M4 9h16v11H4z" /><path d="M3 9l1.5-5h15L21 9M9 20v-6h6v6" /></svg>),
  branding: (<svg {...S}><circle cx="12" cy="12" r="9" /><circle cx="8.5" cy="10" r="1" /><circle cx="15.5" cy="10" r="1" /><circle cx="12" cy="15" r="1" /></svg>),
  team: (<svg {...S}><circle cx="8" cy="9" r="2.6" /><circle cx="17" cy="9" r="2.2" /><path d="M2.5 19c0-2.6 2.4-4.5 5.5-4.5s5.5 1.9 5.5 4.5M15 15c2.6 0 5 1.6 5 4" /></svg>),
  calendar: (<svg {...S}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M12 13v4M10 15h4" /></svg>),
  bell: (<svg {...S}><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 004 0" /></svg>),
  billing: (<svg {...S}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>),
};
