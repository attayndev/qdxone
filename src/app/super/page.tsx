import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import { ROOT_DOMAIN } from "@/lib/host";
import { effectiveTier, monthlyBasePrice } from "@/lib/plan";
import { platformContext } from "@/lib/super/guard";
import { orgActivityMap } from "@/lib/super/metrics";
import { SuperNav } from "@/components/super/SuperNav";
import { SuperFilters } from "@/components/super/SuperFilters";
import { SuperLogin } from "@/components/super/SuperLogin";
import type { OrganizationRow } from "@/lib/supabase/types";

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function SuperAdminPage({ searchParams }: PageProps) {
  const { user, isAdmin } = await platformContext();
  if (!isAdmin) return <SuperLogin signedInEmail={user?.email ?? null} />;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const statusFilter = sp.status ?? "";

  const admin = adminClient();
  const [{ data: orgs }, activity] = await Promise.all([
    admin.from("organizations").select("*").order("created_at", { ascending: false }),
    orgActivityMap(),
  ]);
  let list = (orgs ?? []) as OrganizationRow[];

  const totals = {
    active: list.filter((o) => o.status === "active").length,
    trial: list.filter((o) => o.status === "trialing").length,
    pastDue: list.filter((o) => o.status === "past_due").length,
  };
  // Rough MRR — actively-paying self-serve orgs only (Enterprise is custom).
  const mrr = list.reduce((sum, o) => {
    if (o.status !== "active") return sum;
    const tier = effectiveTier(o);
    if (tier === "enterprise") return sum;
    return sum + monthlyBasePrice(tier, o.location_count);
  }, 0);

  if (statusFilter) list = list.filter((o) => o.status === statusFilter);
  if (q) list = list.filter((o) => o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q));

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 bg-[color:var(--brand-cream)]">
      <div className="max-w-6xl mx-auto">
        <SuperNav active="orgs" />

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Stat label="Orgs" value={(orgs ?? []).length} />
          <Stat label="Active" value={totals.active} />
          <Stat label="Trial" value={totals.trial} />
          <Stat label="Past due" value={totals.pastDue} />
          <Stat label="MRR (rough)" value={`$${mrr}`} />
        </div>

        <SuperFilters />

        <div className="card p-0 overflow-hidden">
          <ul className="divide-y divide-[color:var(--brand-line)]">
            {list.length === 0 && (
              <li className="p-6 text-sm text-[color:var(--brand-ink-muted)]">
                No organizations match.
              </li>
            )}
            {list.map((o) => {
              const a = activity.get(o.id);
              return (
                <li key={o.id} className="p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <Link
                      href={`/super/${o.id}`}
                      className="font-bold hover:text-[color:var(--brand-blue-600)]"
                    >
                      {o.name}
                    </Link>
                    <div className="text-xs text-[color:var(--brand-ink-muted)] flex flex-wrap gap-2 mt-0.5">
                      <span>{o.slug}.{ROOT_DOMAIN}</span>
                      <span>·</span>
                      <span>{o.plan}</span>
                      <span>·</span>
                      <span>{o.status}</span>
                      <span>·</span>
                      <span>created {new Date(o.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-xs text-[color:var(--brand-ink-muted)] flex gap-4 shrink-0">
                    <Metric n={a?.postings ?? 0} label="posts" />
                    <Metric n={a?.applicants ?? 0} label="applied" />
                    <Metric n={a?.assessments ?? 0} label="assessed" />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">{label}</div>
      <div className="text-3xl font-black mt-1">{value}</div>
    </div>
  );
}

function Metric({ n, label }: { n: number; label: string }) {
  return (
    <span className="text-center">
      <span className="block text-lg font-black text-[color:var(--brand-ink)] leading-none">{n}</span>
      <span className="block">{label}</span>
    </span>
  );
}
