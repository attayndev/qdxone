import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { extractSlugFromHost, orgUrl } from "@/lib/tenancy";
import { headers } from "next/headers";
import type { OrganizationRow } from "@/lib/supabase/types";

/**
 * Cross-org operator view. Lives at the apex (`qdx.one/super`) and is
 * gated to the email(s) listed in PLATFORM_OWNER_EMAILS (comma-sep).
 */
export default async function SuperAdminPage() {
  // Apex only.
  const h = await headers();
  const slug = extractSlugFromHost(h.get("host"));
  if (slug) notFound();

  const allowed = (process.env.PLATFORM_OWNER_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const supa = await createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user || !allowed.includes((user.email ?? "").toLowerCase())) {
    notFound();
  }

  const admin = adminClient();
  const { data: orgs } = await admin
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });
  const list = (orgs ?? []) as OrganizationRow[];

  const totals = {
    active: list.filter((o) => o.status === "active").length,
    trial: list.filter((o) => o.status === "trialing").length,
    pastDue: list.filter((o) => o.status === "past_due").length,
    canceled: list.filter((o) => o.status === "canceled").length,
  };

  // Rough MRR — only actively-paying orgs (trialing not yet counted).
  const mrr = list.reduce((sum, o) => {
    if (o.status !== "active") return sum;
    if (o.plan === "starter") return sum + 49;
    if (o.plan === "growth") return sum + 99;
    if (o.plan === "pro") return sum + 249;
    return sum; // enterprise: custom pricing, not counted
  }, 0);

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 bg-[color:var(--brand-cream)]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black tracking-tight">
            Operator dashboard
          </h1>
          <Link href="/" className="text-sm font-semibold underline">
            Back to apex
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Stat label="Orgs" value={list.length} />
          <Stat label="Active" value={totals.active} />
          <Stat label="Trial" value={totals.trial} />
          <Stat label="Past due" value={totals.pastDue} />
          <Stat label="MRR (rough)" value={`$${mrr}`} />
        </div>

        <div className="card mt-6 p-0 overflow-hidden">
          <ul className="divide-y divide-[color:var(--brand-line)]">
            {list.length === 0 && (
              <li className="p-6 text-sm text-[color:var(--brand-ink-muted)]">
                No organizations yet.
              </li>
            )}
            {list.map((o) => (
              <li
                key={o.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap"
              >
                <div>
                  <a
                    href={orgUrl(o.slug)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold hover:text-[color:var(--brand-pink-600)]"
                  >
                    {o.name}
                  </a>
                  <div className="text-xs text-[color:var(--brand-ink-muted)] flex flex-wrap gap-2 mt-0.5">
                    <span>{o.slug}.qdx.one</span>
                    <span>·</span>
                    <span>{o.plan}</span>
                    <span>·</span>
                    <span>{o.billing_cycle ?? "—"}</span>
                    <span>·</span>
                    <span>{o.status}</span>
                    <span>·</span>
                    <span>created {new Date(o.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
        {label}
      </div>
      <div className="text-3xl font-black mt-1">{value}</div>
    </div>
  );
}
