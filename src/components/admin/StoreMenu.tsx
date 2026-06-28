"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/Brand";
import LogoutButton from "@/components/LogoutButton";
import type { OrganizationRow } from "@/lib/supabase/types";

const ITEM =
  "px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[color:var(--brand-cream)] whitespace-nowrap";

const PRIMARY = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/candidates", label: "Candidates" },
  { href: "/admin/postings", label: "Postings" },
  { href: "/admin/roles", label: "Roles" },
];
const SECONDARY = [
  { href: "/admin/locations", label: "Store" },
  { href: "/admin/settings", label: "Page & branding" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/eeo", label: "Fairness" },
  { href: "/admin/billing", label: "Billing" },
];

/**
 * The whole admin nav, behind the store name + logo. Closes on navigation,
 * outside click, and Escape (a plain <details> stays open across Next's
 * client-side route changes, which is the bug this fixes).
 */
export function StoreMenu({
  org,
  userEmail,
}: {
  org: OrganizationRow | null;
  userEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 cursor-pointer"
      >
        <BrandMark org={org} override={{ subtitle: "Admin" }} />
        <span className="text-[color:var(--brand-ink-muted)] text-sm" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute left-0 mt-3 z-30 min-w-[220px] flex flex-col bg-[color:var(--brand-surface)] border border-[color:var(--brand-line)] rounded-2xl shadow-lg p-2">
          {PRIMARY.map((l) => (
            <Link key={l.href} href={l.href} onClick={close} className={ITEM}>
              {l.label}
            </Link>
          ))}
          <div className="my-1.5 border-t border-[color:var(--brand-line)]" />
          {SECONDARY.map((l) => (
            <Link key={l.href} href={l.href} onClick={close} className={ITEM}>
              {l.label}
            </Link>
          ))}
          <div className="my-1.5 border-t border-[color:var(--brand-line)]" />
          {userEmail && (
            <div className="px-3 pb-1 text-xs text-[color:var(--brand-ink-muted)] truncate">
              {userEmail}
            </div>
          )}
          <div className="px-1">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
