import { notFound } from "next/navigation";
import Link from "next/link";
import { currentOrg } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import { ATTENTION_CHECKS, orgCategoryAverages } from "@/lib/assessment/session";
import {
  scoreAssessment,
  assessValidity,
  screenerProfile,
  type ScoredItem,
  type ScoreResult,
  type ScreenerFlag,
  type Band,
} from "@/lib/assessment/scoring";
import DeleteCandidateButton from "@/components/admin/DeleteCandidateButton";
import SendAssessmentButton from "@/components/admin/SendAssessmentButton";
import DecisionControl from "@/components/admin/DecisionControl";
import { isDecision, type Decision } from "@/lib/candidate-decision";
import type { Database } from "@/lib/supabase/database.types";

type AppRow = Database["public"]["Tables"]["applications"]["Row"];
type RespRow = Database["public"]["Tables"]["assessment_responses"]["Row"];

const DAY_LABEL: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};
const BLOCK_LABEL: Record<string, string> = {
  morning: "AM", afternoon: "Mid", evening: "PM",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateDetail({ params }: PageProps) {
  const { id } = await params;
  const org = await currentOrg();
  if (!org) notFound();

  const supa = adminClient();
  const { data: app } = await supa
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!app) notFound();
  // decision columns added in migration 0012 — not in generated types yet.
  const a = app as AppRow & {
    decision: string | null;
    decision_reason: string | null;
    decision_at: string | null;
  };
  const currentDecision: Decision | null = isDecision(a.decision) ? a.decision : null;

  const { data: session } = await supa
    .from("assessment_sessions")
    .select("id, status, completed_at, methodology_version")
    .eq("application_id", id)
    .eq("subject_type", "candidate")
    .maybeSingle();

  let responses: RespRow[] = [];
  const itemText = new Map<string, string>();
  const screenerQ = new Map<string, { question: string; options: { value: number; label: string }[] }>();
  let score: ScoreResult | null = null;
  let benchmark: { averages: Map<string, number>; n: number } | null = null;
  let screenerFlags: ScreenerFlag[] = [];
  let scoredItems: ScoredItem[] = [];
  if (session) {
    const { data: resp } = await supa
      .from("assessment_responses")
      .select("*")
      .eq("session_id", session.id)
      .order("sequence", { ascending: true });
    responses = (resp as RespRow[] | null) ?? [];

    const pIds = responses.filter((r) => r.item_kind === "personality").map((r) => r.item_id);
    const { data: items } = await supa
      .from("item_bank_items")
      .select("item_id, item_text, facet, category_academic, category_ui, keying")
      .eq("version", session.methodology_version)
      .in("item_id", pIds.length ? pIds : ["__none__"]);
    type Meta = {
      item_id: string;
      item_text: string;
      facet: string;
      category_academic: string;
      category_ui: string;
      keying: string;
    };
    const meta = new Map<string, Meta>();
    for (const i of (items as Meta[] | null) ?? []) {
      itemText.set(i.item_id, i.item_text);
      meta.set(i.item_id, i);
    }

    // Score the personality responses.
    scoredItems = responses
      .filter((r) => r.item_kind === "personality" && r.value_int != null && meta.has(r.item_id))
      .map((r) => {
        const m = meta.get(r.item_id)!;
        return {
          value: r.value_int as number,
          facet: m.facet,
          category: m.category_academic,
          keying: (m.keying === "reverse" ? "reverse" : "positive") as
            | "positive"
            | "reverse",
        };
      });
    const categoryUi: Record<string, string> = {};
    for (const m of meta.values()) categoryUi[m.category_academic] = m.category_ui;
    if (scoredItems.length) score = scoreAssessment(scoredItems, categoryUi);
    if (score) benchmark = await orgCategoryAverages(org.id);

    const sIds = responses.filter((r) => r.item_kind === "screener").map((r) => r.item_id);
    const { data: scr } = await supa
      .from("screener_items")
      .select("item_id, question, options")
      .eq("version", session.methodology_version)
      .in("item_id", sIds.length ? sIds : ["__none__"]);
    for (const s of scr ?? []) {
      screenerQ.set(s.item_id, {
        question: s.question,
        options: (s.options as { value: number; label: string }[] | null) ?? [],
      });
    }

    const screenerAnswers: Record<string, number | null> = {};
    for (const r of responses.filter((r) => r.item_kind === "screener")) {
      screenerAnswers[r.item_id] = r.value_int;
    }
    screenerFlags = screenerProfile(screenerAnswers);
  }

  // Response-quality / validity. Centralized in the scorer so it matches what
  // gates the notifications; a hard fail means the fit can't be trusted.
  const likert = responses.filter((r) => r.item_kind === "personality" && r.value_int != null);
  const attn = responses.filter((r) => r.item_kind === "attention_check");
  const attnFail = attn.filter(
    (r) => r.value_int !== ATTENTION_CHECKS.find((c) => c.itemId === r.item_id)?.expected
  ).length;
  const fast = responses.filter((r) => r.response_ms != null && r.response_ms < 1500).length;
  const straightLine = likert.length > 3 && new Set(likert.map((r) => r.value_int)).size === 1;

  const validity = scoredItems.length
    ? assessValidity({ scored: scoredItems, attnFail, attnTotal: attn.length, fastCount: fast, straightLine })
    : null;
  const flags: string[] = validity?.reasons ?? [];
  const unreliable = validity ? !validity.valid : false;

  const availability = (a.availability ?? {}) as Record<string, string[]>;
  const availDays = Object.entries(availability).filter(([, v]) => Array.isArray(v) && v.length);
  const workHistory = (a.work_history ?? []) as {
    employer: string;
    role: string;
    from?: string;
    to?: string;
    dates?: string;
  }[];
  const refs = (a.job_references ?? []) as { name: string; contact: string }[];
  const customAnswers = (a.custom_answers ?? []) as {
    id: string;
    label: string;
    value: string;
  }[];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin/candidates" className="text-sm text-[color:var(--brand-ink-muted)] hover:underline">
          ← All candidates
        </Link>
        <DeleteCandidateButton id={a.id} name={`${a.first_name} ${a.last_name}`} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            {a.first_name} {a.last_name}
          </h1>
          <p className="text-[color:var(--brand-ink-muted)]">
            {a.positions?.[0] ?? "—"} · {a.email}
            {a.phone ? ` · ${a.phone}` : ""} · applied{" "}
            {new Date(a.submitted_at).toLocaleDateString()}
          </p>
        </div>
        <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)]">
          {session ? `Assessment: ${session.status}` : "No assessment"}
        </span>
      </div>

      {unreliable && (
        <div className="mt-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
          <div className="font-bold text-amber-900">⚠️ Score unreliable — answers weren&apos;t careful</div>
          <p className="text-sm text-amber-900/80 mt-1">
            This candidate {flags.join("; ").toLowerCase()}. The fit below can&apos;t be
            trusted — don&apos;t reject them on it; consider an interview or a retake.
          </p>
        </div>
      )}

      {score && score.overall !== "Incomplete" ? (
        <ReportCard score={score} flags={screenerFlags} benchmark={benchmark} />
      ) : (
        <p className="mt-2 text-xs text-[color:var(--brand-ink-muted)]">
          {session
            ? "Assessment in progress — the full report appears once it's complete."
            : "No assessment yet."}
        </p>
      )}

      <div className="mt-6">
        <DecisionControl
          applicationId={a.id}
          initialDecision={currentDecision}
          initialReason={a.decision_reason ?? ""}
          decidedLabel={
            a.decision_at
              ? `Recorded ${new Date(a.decision_at).toLocaleDateString()}`
              : null
          }
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6 mt-6">
        {/* Application */}
        <div className="card">
          <h2 className="font-extrabold text-lg">Application</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Eligible to work in US" value={a.eligible_to_work == null ? "—" : a.eligible_to_work ? "Yes" : "No"} />
            <Row label="ZIP" value={a.postal_code ?? "—"} />
            <Row label="Earliest start" value={a.earliest_start_date ?? "—"} />
          </dl>

          <h3 className="font-bold mt-4">Availability</h3>
          {availDays.length === 0 ? (
            <p className="text-sm text-[color:var(--brand-ink-muted)]">Not provided.</p>
          ) : (
            <ul className="mt-1 text-sm space-y-0.5">
              {availDays.map(([day, blocks]) => (
                <li key={day}>
                  <span className="font-semibold">{DAY_LABEL[day] ?? day}:</span>{" "}
                  {blocks.map((b) => BLOCK_LABEL[b] ?? b).join(", ")}
                </li>
              ))}
            </ul>
          )}

          <h3 className="font-bold mt-4">Recent jobs</h3>
          {workHistory.length === 0 ? (
            <p className="text-sm text-[color:var(--brand-ink-muted)]">None listed.</p>
          ) : (
            <ul className="mt-1 text-sm space-y-1">
              {workHistory.map((j, i) => {
                const span = [j.from, j.to].filter(Boolean).join(" – ") || j.dates;
                return (
                  <li key={i}>
                    {[j.role, j.employer, span].filter(Boolean).join(" · ")}
                  </li>
                );
              })}
            </ul>
          )}

          <h3 className="font-bold mt-4">References</h3>
          {refs.length === 0 ? (
            <p className="text-sm text-[color:var(--brand-ink-muted)]">None listed.</p>
          ) : (
            <ul className="mt-1 text-sm space-y-1">
              {refs.map((r, i) => (
                <li key={i}>{[r.name, r.contact].filter(Boolean).join(" · ")}</li>
              ))}
            </ul>
          )}

          {customAnswers.some((c) => c.value) && (
            <>
              <h3 className="font-bold mt-4">More questions</h3>
              <ul className="mt-1 text-sm space-y-1">
                {customAnswers
                  .filter((c) => c.value)
                  .map((c) => (
                    <li key={c.id}>
                      <span className="text-[color:var(--brand-ink-muted)]">
                        {c.label}:
                      </span>{" "}
                      {c.value}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>

        {/* Assessment */}
        <div className="space-y-6">
          {flags.length > 0 && (
            <div className="card border-2 border-[color:var(--brand-pink)]">
              <h2 className="font-extrabold text-lg">⚠️ Quality flags</h2>
              <ul className="mt-2 space-y-1">
                {flags.map((f) => (
                  <li key={f} className="text-sm">{f}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <h2 className="font-extrabold text-lg">Assessment responses</h2>
            {responses.length === 0 ? (
              session ? (
                <p className="text-sm text-[color:var(--brand-ink-muted)] mt-2">
                  Sent — not started yet.
                </p>
              ) : (
                <div className="mt-3">
                  <p className="text-sm text-[color:var(--brand-ink-muted)] mb-3">
                    No assessment sent yet. Review the application, then send it.
                  </p>
                  <SendAssessmentButton id={a.id} />
                </div>
              )
            ) : (
              <div className="mt-3 space-y-3">
                {responses.map((r) => (
                  <div key={r.id} className="text-sm">
                    {r.item_kind === "screener" ? (
                      <>
                        <div className="font-semibold">{screenerQ.get(r.item_id)?.question ?? r.item_id}</div>
                        <div className="text-[color:var(--brand-ink)]">
                          {r.value_text
                            ? r.value_text
                            : screenerQ.get(r.item_id)?.options.find((o) => o.value === r.value_int)?.label ?? r.value_int ?? "—"}
                        </div>
                      </>
                    ) : r.item_kind === "attention_check" ? (
                      <div className="text-[color:var(--brand-ink-muted)]">
                        Attention check ({r.item_id}): answered {r.value_int}
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <span>{itemText.get(r.item_id) ?? r.item_id}</span>
                        <span className="font-mono shrink-0">{r.value_int}/5</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const BAND_TONE: Record<Band, string> = {
  High: "bg-emerald-100 text-emerald-800",
  Mid: "bg-amber-100 text-amber-800",
  Low: "bg-rose-100 text-rose-700",
};
const OVERALL_TONE: Record<string, string> = {
  "Strong fit": "bg-emerald-600 text-white",
  Consider: "bg-emerald-100 text-emerald-900",
  Caution: "bg-amber-100 text-amber-900",
  "Not recommended": "bg-rose-600 text-white",
};

function crewCompare(mean: number, avg: number): string {
  const d = mean - avg;
  if (d >= 0.3) return "Above your applicants";
  if (d <= -0.3) return "Below your applicants";
  return "About your applicants";
}

function ReportCard({
  score,
  flags,
  benchmark,
}: {
  score: ScoreResult;
  flags: ScreenerFlag[];
  benchmark: { averages: Map<string, number>; n: number } | null;
}) {
  // Only show the local benchmark once there's a meaningful pool to compare to.
  const showBench = !!benchmark && benchmark.n >= 3;
  return (
    <div className="card mt-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full font-extrabold ${OVERALL_TONE[score.overall] ?? ""}`}
          >
            {score.overall}
          </span>
          <span className="text-lg tracking-wide" aria-label={`${score.stars} of 5`}>
            {"★".repeat(score.stars)}
            <span className="text-[color:var(--brand-line)]">
              {"★".repeat(5 - score.stars)}
            </span>
          </span>
        </div>
        <span className="text-xs text-[color:var(--brand-ink-muted)]">
          Pre-pilot · verbal bands
        </span>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        {score.categories.map((c) => (
          <div
            key={c.category}
            className="rounded-xl border border-[color:var(--brand-line)] p-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">{c.categoryUi}</span>
              <span className={`chip ${BAND_TONE[c.band]}`}>{c.band}</span>
            </div>
            {showBench && benchmark!.averages.has(c.category) && (
              <div className="mt-1 text-xs text-[color:var(--brand-ink-muted)]">
                {crewCompare(c.mean, benchmark!.averages.get(c.category)!)}
              </div>
            )}
            <ul className="mt-2 space-y-1">
              {c.facets.map((f) => (
                <li
                  key={f.facet}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[color:var(--brand-ink-muted)]">{f.facet}</span>
                  <span className={`chip ${BAND_TONE[f.band]}`}>{f.band}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {score.attitude && (
        <div className="mt-3 flex items-center gap-2 text-sm flex-wrap">
          <span className="font-bold">Attitude composite</span>
          <span className={`chip ${BAND_TONE[score.attitude.band]}`}>
            {score.attitude.band}
          </span>
          <span className="text-xs text-[color:var(--brand-ink-muted)]">
            (coachability + warmth + cooperation)
          </span>
        </div>
      )}

      {flags.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold text-sm">Screener</h3>
          <ul className="mt-1 space-y-0.5">
            {flags.map((f, i) => (
              <li
                key={i}
                className={`text-sm ${
                  f.tone === "positive"
                    ? "text-emerald-700"
                    : f.tone === "concern"
                      ? "text-rose-700"
                      : "text-[color:var(--brand-ink-muted)]"
                }`}
              >
                {f.tone === "positive" ? "✓ " : f.tone === "concern" ? "⚠ " : "• "}
                {f.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-xs text-[color:var(--brand-ink-muted)]">
        Bands use raw anchors (pre-pilot). Recommendations are decision support
        — you always make the call.
      </p>
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
