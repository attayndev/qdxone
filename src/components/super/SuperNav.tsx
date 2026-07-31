import Link from "next/link";

/** Top nav for the platform console. `active` highlights the current section. */
export function SuperNav({ active }: { active: "orgs" | "leads" | "validation" }) {
  return (
    <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-black tracking-tight">Platform</h1>
        <nav className="flex items-center gap-3 text-sm">
          <Tab href="/super" label="Organizations" on={active === "orgs"} />
          <Tab href="/super/leads" label="Leads" on={active === "leads"} />
          <Tab href="/super/validation" label="Validation" on={active === "validation"} />
        </nav>
      </div>
      <Link href="/" className="text-sm font-semibold underline">
        Back to apex
      </Link>
    </div>
  );
}

function Tab({ href, label, on }: { href: string; label: string; on: boolean }) {
  return (
    <Link
      href={href}
      className={
        "font-semibold px-3 py-1.5 rounded-full " +
        (on
          ? "bg-[color:var(--brand-blue)] text-white"
          : "text-[color:var(--brand-ink)] hover:bg-[color:var(--brand-soft)]")
      }
    >
      {label}
    </Link>
  );
}
