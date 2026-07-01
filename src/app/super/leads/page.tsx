import { adminClient } from "@/lib/supabase/admin";
import { requirePlatformOwner } from "@/lib/super/guard";
import { SuperNav } from "@/components/super/SuperNav";

/** Demo requests captured by the marketing form (audit_events lead.demo_requested). */
interface Lead {
  name?: string;
  email?: string;
  concept?: string | null;
  units?: string | null;
  note?: string | null;
}

export default async function LeadsPage() {
  await requirePlatformOwner();
  const admin = adminClient();
  const { data: rows } = await admin
    .from("audit_events")
    .select("meta, created_at")
    .eq("kind", "lead.demo_requested")
    .order("created_at", { ascending: false })
    .limit(200);
  const leads = (rows as { meta: Lead | null; created_at: string }[] | null) ?? [];

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 bg-[color:var(--brand-cream)]">
      <div className="max-w-4xl mx-auto">
        <SuperNav active="leads" />

        <p className="text-sm text-[color:var(--brand-ink-muted)] mb-4">
          {leads.length} demo request{leads.length === 1 ? "" : "s"} from the marketing site.
        </p>

        <div className="card p-0 overflow-hidden">
          <ul className="divide-y divide-[color:var(--brand-line)]">
            {leads.length === 0 && (
              <li className="p-6 text-sm text-[color:var(--brand-ink-muted)]">
                No demo requests yet.
              </li>
            )}
            {leads.map((l, i) => {
              const m = l.meta ?? {};
              return (
                <li key={i} className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="font-bold">{m.name || "—"}</span>
                    <span className="text-xs text-[color:var(--brand-ink-muted)]">
                      {new Date(l.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm mt-1">
                    {m.email ? (
                      <a href={`mailto:${m.email}`} className="text-[color:var(--brand-blue-600)] hover:underline">
                        {m.email}
                      </a>
                    ) : (
                      "—"
                    )}
                    {(m.concept || m.units) && (
                      <span className="text-[color:var(--brand-ink-muted)]">
                        {" · "}
                        {[m.concept, m.units && `${m.units} units`].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                  {m.note && (
                    <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1 italic">
                      &ldquo;{m.note}&rdquo;
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </main>
  );
}
