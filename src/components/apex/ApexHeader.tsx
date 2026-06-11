import Link from "next/link";

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/assessments", label: "Assessments" },
  { href: "/for-qsr", label: "Multi-unit" },
  { href: "/for-independents", label: "Independents" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function ApexHeader({ active }: { active?: string } = {}) {
  return (
    <header className="w-full border-b border-[color:var(--brand-line)] bg-[color:var(--brand-cream)] sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="font-black text-2xl tracking-tight">
          <span className="text-[color:var(--brand-pink)]">qdx</span>
          <span className="text-[color:var(--brand-ink-muted)] text-sm font-semibold ml-1.5 align-middle">
            .one
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={
                "font-semibold hover:text-[color:var(--brand-pink)] " +
                (active === n.href
                  ? "text-[color:var(--brand-pink-600)]"
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
            className="hidden sm:inline text-sm font-semibold hover:text-[color:var(--brand-pink)]"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="btn-primary !py-2 !px-3.5 !text-sm !shadow-[0_4px_0_var(--brand-pink-600)]"
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
                  ? "text-[color:var(--brand-pink-600)]"
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
          <div className="font-black text-xl tracking-tight">
            <span className="text-[color:var(--brand-pink)]">qdx</span>
            <span className="text-[color:var(--brand-ink-muted)] text-xs font-semibold ml-1.5 align-middle">
              .one
            </span>
          </div>
          <p className="mt-2 text-xs text-[color:var(--brand-ink-muted)]">
            The hiring platform built for restaurants.
          </p>
        </div>
        <FooterCol title="Product">
          <FL href="/how-it-works">How it works</FL>
          <FL href="/assessments">Assessments</FL>
          <FL href="/pricing">Pricing</FL>
          <FL href="/demo">Book a demo</FL>
        </FooterCol>
        <FooterCol title="For operators">
          <FL href="/for-qsr">Multi-unit</FL>
          <FL href="/for-independents">Independents</FL>
        </FooterCol>
        <FooterCol title="Company">
          <FL href="/about">About</FL>
          <FL href="/login">Sign in</FL>
          <FL href="/signup">Start free</FL>
        </FooterCol>
      </div>
      <div className="border-t border-[color:var(--brand-line)] px-4 sm:px-6 py-4 text-xs text-[color:var(--brand-ink-muted)] flex justify-between max-w-6xl mx-auto">
        <span>© {new Date().getFullYear()} qdx</span>
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
        className="hover:text-[color:var(--brand-pink-600)] font-medium"
      >
        {children}
      </Link>
    </li>
  );
}
