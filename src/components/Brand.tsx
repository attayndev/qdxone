import Link from "next/link";
import type { OrganizationRow } from "@/lib/supabase/types";
import { apexUrl } from "@/lib/host";

/**
 * Brand mark — bold short name in the org's primary color, full name
 * + location subtitle next to it. Per-org branding comes from
 * `organizations.branding`.
 */
export function BrandMark({
  org,
  override,
}: {
  org?: OrganizationRow | null;
  override?: { display_name?: string; subtitle?: string };
}) {
  const display =
    override?.display_name ?? org?.branding.display_name ?? org?.name ?? "QDX";
  const subtitle =
    override?.subtitle ?? org?.branding.location_subtitle ?? "";
  // Use first numeric prefix as a "mark" if present (e.g. "16 Handles" → "16")
  const match = display.match(/^(\d+)\s+(.*)$/);
  const numeric = match?.[1];
  const word = match ? match[2] : display;
  const color =
    org?.branding.primary_color ?? "var(--brand-pink)";
  const logoUrl = org?.branding.logo_url;

  // When the org has uploaded/auto-extracted a logo, show it in place of the
  // text mark. Plain <img> (not next/image) so arbitrary operator logo URLs
  // work without an allowlist of remote domains.
  if (logoUrl) {
    return (
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={display}
          className="h-9 w-auto max-w-[200px] object-contain"
        />
        {subtitle && (
          <span className="hidden sm:inline text-xs uppercase tracking-[0.18em] text-[color:var(--brand-ink-muted)]">
            {subtitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {numeric && (
        <span
          className="text-3xl font-black tracking-tight leading-none"
          style={{ color }}
        >
          {numeric}
        </span>
      )}
      <div className="leading-tight">
        <div className="font-extrabold tracking-tight text-[color:var(--brand-ink)]">
          {word}
        </div>
        {subtitle && (
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--brand-ink-muted)]">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandHeader({
  org,
  showApply = true,
}: {
  org?: OrganizationRow | null;
  showApply?: boolean;
}) {
  return (
    <header className="w-full px-4 sm:px-6 py-4 border-b border-[color:var(--brand-line)] bg-[color:var(--brand-cream)] sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="block">
          <BrandMark org={org} />
        </Link>
        {showApply && (
          <span className="text-xs sm:text-sm text-[color:var(--brand-pink-600)] font-semibold">
            Careers · Now hiring
          </span>
        )}
      </div>
    </header>
  );
}

export function BrandFooter({ org }: { org?: OrganizationRow | null }) {
  const name = org?.name ?? "QDX";
  return (
    <footer className="w-full mt-12 border-t border-[color:var(--brand-line)] bg-[color:var(--brand-surface)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-xs text-[color:var(--brand-ink-muted)] flex flex-wrap gap-2 items-center justify-between">
        <span>© {new Date().getFullYear()} {name}</span>
        <span className="opacity-70">
          Powered by{" "}
          <Link href={apexUrl()} className="underline">
            qdx
          </Link>
        </span>
      </div>
    </footer>
  );
}
