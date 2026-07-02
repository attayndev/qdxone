import { notFound } from "next/navigation";
import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import { userDisplay } from "@/lib/user-name";
import { DEMO_SLUG } from "@/lib/demo/seed";
import SuperOrgControls from "@/components/super/SuperOrgControls";
import { ROOT_DOMAIN } from "@/lib/host";
import { orgUrl } from "@/lib/tenancy";
import { getOrgLocations } from "@/lib/locations";
import { requirePlatformOwner } from "@/lib/super/guard";
import { orgActivity } from "@/lib/super/metrics";
import type { OrganizationRow } from "@/lib/supabase/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrgDetailPage({ params }: PageProps) {
  await requirePlatformOwner();
  const { id } = await params;
  const admin = adminClient();

  const { data: orgRow } = await admin.from("organizations").select("*").eq("id", id).maybeSingle();
  const org = orgRow as OrganizationRow | null;
  if (!org) notFound();

  const [{ data: memberRows }, locations, activity, { data: events }] = await Promise.all([
    admin.from("org_members").select("user_id, role").eq("org_id", id),
    getOrgLocations(id),
    orgActivity(id),
    admin
      .from("audit_events")
      .select("kind, meta, created_at")
      .eq("org_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Resolve member emails (small roster; service-role auth lookup each).
  const members = ((memberRows as { user_id: string; role: string }[] | null) ?? []) as {
    user_id: string;
    role: string;
  }[];
  const roster = await Promise.all(
    members.map(async (m) => {
      const { data } = await admin.auth.admin.getUserById(m.user_id);
      return { role: m.role, email: userDisplay(data.user ?? { email: m.user_id }) };
    })
  );

  const auditEvents = (events as { kind: string; meta: unknown; created_at: string }[] | null) ?? [];

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 bg-[color:var(--brand-cream)]">
      <div className="max-w-4xl mx-auto">
        <Link href="/super" className="text-sm text-[color:var(--brand-ink-muted)] hover:underline">
          ← All organizations
        </Link>

        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2 flex-wrap">
            {org.name}
            {org.suspended_at && (
              <span className="chip bg-rose-100 text-rose-700 text-sm">Suspended</span>
            )}
          </h1>
          <a
            href={orgUrl(org.slug)}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-[color:var(--brand-blue-600)] hover:underline"
          >
            Open {org.slug}.{ROOT_DOMAIN} →
          </a>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <Stat label="Postings" value={activity.postings} />
          <Stat label="Applicants" value={activity.applicants} />
          <Stat label="Assessed" value={activity.assessments} />
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          <div className="card">
            <h2 className="font-extrabold text-lg">Account</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Plan" value={org.plan} />
              <Row label="Billing" value={org.billing_cycle ?? "—"} />
              <Row label="Status" value={org.status} />
              <Row label="Locations" value={String(org.location_count)} />
              <Row label="Signed up" value={new Date(org.created_at).toLocaleDateString()} />
              <Row
                label="Last activity"
                value={activity.lastActivityAt ? new Date(activity.lastActivityAt).toLocaleDateString() : "—"}
              />
            </dl>

            <h3 className="font-bold mt-4">Team</h3>
            {roster.length === 0 ? (
              <p className="text-sm text-[color:var(--brand-ink-muted)]">No members.</p>
            ) : (
              <ul className="mt-1 text-sm space-y-1">
                {roster.map((m, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="truncate">{m.email}</span>
                    <span className="text-[color:var(--brand-ink-muted)]">{m.role}</span>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="font-bold mt-4">Stores</h3>
            {locations.length === 0 ? (
              <p className="text-sm text-[color:var(--brand-ink-muted)]">None.</p>
            ) : (
              <ul className="mt-1 text-sm space-y-0.5">
                {locations.map((l) => (
                  <li key={l.id}>{l.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 className="font-extrabold text-lg">Recent activity</h2>
            {auditEvents.length === 0 ? (
              <p className="text-sm text-[color:var(--brand-ink-muted)] mt-2">No events yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {auditEvents.map((e, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="font-mono text-xs">{e.kind}</span>
                    <span className="text-[color:var(--brand-ink-muted)] text-xs shrink-0">
                      {new Date(e.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6">
          <SuperOrgControls
            orgId={org.id}
            slug={org.slug}
            suspended={!!org.suspended_at}
            isDemo={org.slug === DEMO_SLUG}
          />
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card text-center">
      <div className="text-3xl font-black">{value}</div>
      <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)] mt-1">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[color:var(--brand-ink-muted)]">{label}</dt>
      <dd className="font-semibold text-right">{value}</dd>
    </div>
  );
}
