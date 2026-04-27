import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RECOMMENDATION_LABELS } from "@/lib/questionnaire/scoring";
import type {
  ApplicantRow,
  InvitationRow,
} from "@/lib/supabase/types";
import { currentOrg } from "@/lib/tenancy";

export default async function AdminDashboard() {
  const org = await currentOrg();
  if (!org) notFound();
  const supa = await createClient();

  const [{ data: invs }, { data: apps }] = await Promise.all([
    supa
      .from("invitations")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(200),
    supa
      .from("applicants")
      .select("*")
      .eq("org_id", org.id)
      .order("submitted_at", { ascending: false })
      .limit(200),
  ]);

  const invitations = (invs ?? []) as InvitationRow[];
  const applicants = (apps ?? []) as ApplicantRow[];

  const sent = invitations.filter((i) =>
    ["sent", "opened", "started", "submitted"].includes(i.status)
  ).length;
  const opened = invitations.filter((i) =>
    ["opened", "started", "submitted"].includes(i.status)
  ).length;
  const started = invitations.filter((i) =>
    ["started", "submitted"].includes(i.status)
  ).length;
  const submitted = invitations.filter((i) => i.status === "submitted").length;
  const avgScore =
    applicants.length === 0
      ? 0
      : Math.round(
          applicants.reduce((s, a) => s + (a.total_score ?? 0), 0) /
            applicants.length
        );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
          <p className="text-[color:var(--brand-ink-muted)]">
            At a glance — invitations, applicants, and recent activity.
          </p>
        </div>
        <Link href="/admin/invitations" className="btn-primary">
          + New invitation
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
        <Stat label="Invites sent" value={sent} />
        <Stat label="Opened" value={opened} />
        <Stat label="Started" value={started} />
        <Stat label="Submitted" value={submitted} />
        <Stat label="Avg. score" value={avgScore} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg">Recent applicants</h2>
            <Link
              href="/admin/applicants"
              className="text-sm font-semibold text-[color:var(--brand-pink-600)] hover:underline"
            >
              View all
            </Link>
          </div>
          {applicants.length === 0 ? (
            <p className="text-[color:var(--brand-ink-muted)] mt-3 text-sm">
              No applications yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[color:var(--brand-line)]">
              {applicants.slice(0, 8).map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <Link
                    href={`/admin/applicants/${a.id}`}
                    className="font-semibold hover:text-[color:var(--brand-pink-600)]"
                  >
                    {a.first_name} {a.last_name}
                  </Link>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono">
                      {a.total_score ?? "—"}
                    </span>
                    {a.recommendation && (
                      <RecommendationBadge value={a.recommendation} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg">Recent invitations</h2>
            <Link
              href="/admin/invitations"
              className="text-sm font-semibold text-[color:var(--brand-pink-600)] hover:underline"
            >
              Manage
            </Link>
          </div>
          {invitations.length === 0 ? (
            <p className="text-[color:var(--brand-ink-muted)] mt-3 text-sm">
              No invitations yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[color:var(--brand-line)]">
              {invitations.slice(0, 8).map((i) => (
                <li key={i.id} className="py-3 flex items-center justify-between gap-3">
                  <span className="font-semibold truncate">
                    {[i.first_name, i.last_name].filter(Boolean).join(" ") ||
                      i.email ||
                      "Unnamed"}
                  </span>
                  <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)]">
                    {i.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
        {label}
      </div>
      <div className="text-3xl font-black mt-1">{value}</div>
    </div>
  );
}

function RecommendationBadge({
  value,
}: {
  value: keyof typeof RECOMMENDATION_LABELS;
}) {
  const tone =
    value === "strong_interview"
      ? "bg-[color:var(--brand-mint)]/30 text-[color:var(--brand-ink)]"
      : value === "interview"
        ? "bg-[color:var(--brand-yellow)]/40 text-[color:var(--brand-ink)]"
        : value === "borderline"
          ? "bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)]"
          : "bg-[color:var(--brand-ink)] text-white";
  return <span className={`chip ${tone}`}>{RECOMMENDATION_LABELS[value]}</span>;
}
