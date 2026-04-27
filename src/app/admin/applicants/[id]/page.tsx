import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentOrg } from "@/lib/tenancy";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  RECOMMENDATION_LABELS,
} from "@/lib/questionnaire/scoring";
import { QUESTIONS } from "@/lib/questionnaire/schema";
import type {
  AdminNoteRow,
  ApplicantRow,
  ResponseRow,
} from "@/lib/supabase/types";
import HiringStatusSelect from "@/components/admin/HiringStatusSelect";
import NoteForm from "@/components/admin/NoteForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicantDetail({ params }: PageProps) {
  const { id } = await params;
  const org = await currentOrg();
  if (!org) notFound();
  const supa = await createClient();

  const [{ data: applicant }, { data: responses }, { data: notes }] =
    await Promise.all([
      supa
        .from("applicants")
        .select("*")
        .eq("id", id)
        .eq("org_id", org.id)
        .maybeSingle(),
      supa
        .from("responses")
        .select("*")
        .eq("applicant_id", id)
        .eq("org_id", org.id),
      supa
        .from("admin_notes")
        .select("*")
        .eq("applicant_id", id)
        .eq("org_id", org.id)
        .order("created_at", { ascending: false }),
    ]);

  if (!applicant) notFound();
  const a = applicant as ApplicantRow;
  const respMap = new Map<string, ResponseRow>();
  for (const r of (responses ?? []) as ResponseRow[]) {
    respMap.set(r.question_key, r);
  }

  return (
    <div>
      <Link
        href="/admin/applicants"
        className="text-sm text-[color:var(--brand-ink-muted)] hover:underline"
      >
        ← All applicants
      </Link>

      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            {a.first_name} {a.last_name}
          </h1>
          <p className="text-[color:var(--brand-ink-muted)]">
            {a.email}
            {a.phone ? ` · ${a.phone}` : ""}
            {a.age_band ? ` · ${a.age_band}` : ""}
            {" · submitted "}
            {new Date(a.submitted_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {a.recommendation && (
            <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)]">
              {RECOMMENDATION_LABELS[a.recommendation]}
            </span>
          )}
          <span className="font-mono text-sm">
            Score {a.total_score ?? "—"}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6 mt-6">
        <div className="space-y-6">
          {/* Category scores */}
          <div className="card">
            <h2 className="font-extrabold text-lg">Category scores</h2>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => {
                const score = a.category_scores?.[cat] ?? 0;
                return (
                  <div
                    key={cat}
                    className="rounded-xl border border-[color:var(--brand-line)] p-3"
                  >
                    <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
                      {CATEGORY_LABELS[cat]}
                    </div>
                    <div className="text-2xl font-black mt-1 font-mono">
                      {score}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk flags */}
          {a.risk_flags?.length > 0 && (
            <div className="card border-2 border-[color:var(--brand-pink)]">
              <h2 className="font-extrabold text-lg flex items-center gap-2">
                ⚠️ Risk flags
              </h2>
              <ul className="mt-2 space-y-1">
                {a.risk_flags.map((f) => (
                  <li key={f.key} className="text-sm">
                    <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)]">
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Responses */}
          <div className="card">
            <h2 className="font-extrabold text-lg">Responses</h2>
            <div className="mt-3 space-y-4">
              {QUESTIONS.map((q) => {
                const r = respMap.get(q.id);
                if (!r) return null;
                return (
                  <div key={q.id}>
                    <div className="text-sm font-semibold">{q.prompt}</div>
                    <div className="mt-1 text-[15px] text-[color:var(--brand-ink)]">
                      <RenderAnswer question={q} answer={r.answer} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Hiring status */}
          <div className="card">
            <h2 className="font-extrabold text-lg">Hiring status</h2>
            <div className="mt-3">
              <HiringStatusSelect
                applicantId={a.id}
                value={a.hiring_status}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <h2 className="font-extrabold text-lg">Internal notes</h2>
            <NoteForm applicantId={a.id} />
            <ul className="mt-4 space-y-3">
              {(notes as AdminNoteRow[] | null)?.map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl bg-[color:var(--brand-cream)] p-3 text-sm"
                >
                  <div className="text-xs text-[color:var(--brand-ink-muted)]">
                    {n.author_email ?? "manager"} ·{" "}
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
                </li>
              ))}
              {(notes ?? []).length === 0 && (
                <li className="text-sm text-[color:var(--brand-ink-muted)]">
                  No notes yet.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function RenderAnswer({
  question,
  answer,
}: {
  question: (typeof QUESTIONS)[number];
  answer: unknown;
}) {
  if (answer == null) return <span className="italic">—</span>;
  if (question.kind === "single" || question.kind === "demographic") {
    const choice = question.choices.find((c) => c.value === answer);
    return <span>{choice?.label ?? String(answer)}</span>;
  }
  if (question.kind === "agree") {
    return <span className="font-mono">{String(answer)} / 5</span>;
  }
  return <span className="whitespace-pre-wrap">{String(answer)}</span>;
}
