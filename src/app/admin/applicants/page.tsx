import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ApplicantRow, Recommendation, HiringStatus } from "@/lib/supabase/types";
import { RECOMMENDATION_LABELS } from "@/lib/questionnaire/scoring";
import { currentOrg } from "@/lib/tenancy";

interface PageProps {
  searchParams: Promise<{ rec?: string; status?: string; sort?: string }>;
}

export default async function ApplicantsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const org = await currentOrg();
  if (!org) notFound();
  const supa = await createClient();

  let q = supa.from("applicants").select("*").eq("org_id", org.id);
  if (sp.rec && sp.rec !== "all") q = q.eq("recommendation", sp.rec as Recommendation);
  if (sp.status && sp.status !== "all")
    q = q.eq("hiring_status", sp.status as HiringStatus);

  const sort = sp.sort ?? "score";
  if (sort === "score")
    q = q.order("total_score", { ascending: false, nullsFirst: false });
  else q = q.order("submitted_at", { ascending: false });

  const { data } = await q.limit(500);
  const applicants = (data ?? []) as ApplicantRow[];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Applicants</h1>
          <p className="text-[color:var(--brand-ink-muted)]">
            Sorted by {sort === "score" ? "score" : "newest"}.
          </p>
        </div>
      </div>

      <form className="card mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Recommendation</label>
          <select name="rec" defaultValue={sp.rec ?? "all"} className="input">
            <option value="all">All</option>
            <option value="strong_interview">Strong Interview</option>
            <option value="interview">Interview</option>
            <option value="borderline">Borderline</option>
            <option value="do_not_interview">Do Not Interview</option>
          </select>
        </div>
        <div>
          <label className="label">Hiring status</label>
          <select
            name="status"
            defaultValue={sp.status ?? "all"}
            className="input"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="interview_requested">Interview Requested</option>
            <option value="interviewed">Interviewed</option>
            <option value="rejected">Rejected</option>
            <option value="hired">Hired</option>
          </select>
        </div>
        <div>
          <label className="label">Sort</label>
          <select name="sort" defaultValue={sort} className="input">
            <option value="score">Score</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <button type="submit" className="btn-ghost">
            Apply filters
          </button>
        </div>
      </form>

      <div className="card mt-6 p-0 overflow-hidden">
        <ul className="divide-y divide-[color:var(--brand-line)]">
          {applicants.length === 0 && (
            <li className="p-6 text-sm text-[color:var(--brand-ink-muted)]">
              No applicants match those filters yet.
            </li>
          )}
          {applicants.map((a) => (
            <li key={a.id} className="p-4 sm:p-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/admin/applicants/${a.id}`}
                  className="font-semibold hover:text-[color:var(--brand-pink-600)]"
                >
                  {a.first_name} {a.last_name}
                </Link>
                <div className="text-xs text-[color:var(--brand-ink-muted)] flex flex-wrap gap-2 mt-0.5">
                  <span>{a.email}</span>
                  <span>·</span>
                  <span>{new Date(a.submitted_at).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{a.hiring_status.replace("_", " ")}</span>
                  {(a.risk_flags?.length ?? 0) > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-[color:var(--brand-pink-600)] font-semibold">
                        {a.risk_flags.length} flag
                        {a.risk_flags.length === 1 ? "" : "s"}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono text-sm">{a.total_score ?? "—"}</span>
                {a.recommendation && (
                  <RecChip value={a.recommendation} />
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RecChip({ value }: { value: Recommendation }) {
  const tone =
    value === "strong_interview"
      ? "bg-[color:var(--brand-mint)]/30"
      : value === "interview"
        ? "bg-[color:var(--brand-yellow)]/40"
        : value === "borderline"
          ? "bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)]"
          : "bg-[color:var(--brand-ink)] text-white";
  return <span className={`chip ${tone}`}>{RECOMMENDATION_LABELS[value]}</span>;
}
