import Link from "next/link";
import { QdxWordmark } from "@/components/QdxLogo";
import { ROOT_DOMAIN } from "@/lib/host";

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/assessments", label: "The assessment" },
  { href: "/for-qsr", label: "Multi-location" },
  { href: "/for-independents", label: "Independents" },
  { href: "/pricing", label: "Pricing" },
  { href: `https://demo.${ROOT_DOMAIN}`, label: "Demo" },
  { href: "/about", label: "About" },
];

export function ApexHeader({ active }: { active?: string } = {}) {
  return (
    <header className="w-full border-b border-[color:var(--brand-line)] bg-[color:var(--brand-cream)] sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="block">
          <QdxWordmark />
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={
                "font-semibold hover:text-[color:var(--brand-blue)] " +
                (active === n.href
                  ? "text-[color:var(--brand-blue-600)]"
                  : "text-[color:var(--brand-ink)]")
              }
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden sm:inline text-sm font-semibold hover:text-[color:var(--brand-blue)]"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="btn-primary !py-2 !px-3.5 !text-sm !shadow-[0_4px_0_var(--brand-blue-600)]"
          >
            Start free
          </Link>
        </div>
      </div>
      {/* Mobile horizontal nav */}
      <div className="md:hidden border-t border-[color:var(--brand-line)] overflow-x-auto">
        <div className="flex gap-4 px-4 py-2 text-xs whitespace-nowrap">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={
                "font-semibold " +
                (active === n.href
                  ? "text-[color:var(--brand-blue-600)]"
                  : "text-[color:var(--brand-ink-muted)]")
              }
            >
              {n.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

export function ApexFooter() {
  return (
    <footer className="w-full mt-16 border-t border-[color:var(--brand-line)] bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid sm:grid-cols-4 gap-6 text-sm">
        <div>
          <QdxWordmark size="sm" />
          <p className="mt-2 text-xs text-[color:var(--brand-ink-muted)]">
            Shift-Ready Hiring for restaurants. Know who to call first.
          </p>
        </div>
        <FooterCol title="Product">
          <FL href="/how-it-works">How it works</FL>
          <FL href="/assessments">Assessments</FL>
          <FL href="/pricing">Pricing</FL>
          <FL href="/faq">FAQ</FL>
          <FL href="/demo">Book a demo</FL>
        </FooterCol>
        <FooterCol title="For operators">
          <FL href="/for-qsr">Multi-location</FL>
          <FL href="/for-independents">Independents</FL>
          <FL href="/enterprise">Enterprise &amp; compliance</FL>
        </FooterCol>
        <FooterCol title="Company">
          <FL href="/about">About</FL>
          <FL href="/login">Sign in</FL>
          <FL href="/signup">Start free</FL>
          <FL href="/terms">Terms</FL>
          <FL href="/privacy">Privacy</FL>
          <FL href="/messaging">SMS terms</FL>
        </FooterCol>
      </div>
      <div className="border-t border-[color:var(--brand-line)] px-4 sm:px-6 py-4 text-xs text-[color:var(--brand-ink-muted)] flex justify-between max-w-6xl mx-auto">
        <span>© {new Date().getFullYear()} Attayn Group LLC (DBA QDXone)</span>
        <span>Built by an operator. For operators.</span>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)] font-semibold mb-2">
        {title}
      </div>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function FL({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="hover:text-[color:var(--brand-blue-600)] font-medium"
      >
        {children}
      </Link>
    </li>
  );
}
