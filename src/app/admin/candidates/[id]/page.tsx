import { notFound } from "next/navigation";
import Link from "next/link";
import { currentOrg } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import { ATTENTION_CHECKS } from "@/lib/assessment/session";
import DeleteCandidateButton from "@/components/admin/DeleteCandidateButton";
import SendAssessmentButton from "@/components/admin/SendAssessmentButton";
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
  const a = app as AppRow;

  const { data: session } = await supa
    .from("assessment_sessions")
    .select("id, status, completed_at, methodology_version")
    .eq("application_id", id)
    .eq("subject_type", "candidate")
    .maybeSingle();

  let responses: RespRow[] = [];
  const itemText = new Map<string, string>();
  const screenerQ = new Map<string, { question: string; options: { value: number; label: string }[] }>();
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
      .select("item_id, item_text")
      .eq("version", session.methodology_version)
      .in("item_id", pIds.length ? pIds : ["__none__"]);
    for (const i of items ?? []) itemText.set(i.item_id, i.item_text);

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
  }

  // Careless-response flags.
  const likert = responses.filter((r) => r.item_kind === "personality" && r.value_int != null);
  const fast = responses.filter((r) => r.response_ms != null && r.response_ms < 1500).length;
  const attnFail = responses
    .filter((r) => r.item_kind === "attention_check")
    .filter((r) => r.value_int !== ATTENTION_CHECKS.find((c) => c.itemId === r.item_id)?.expected).length;
  const straightLine = likert.length > 3 && new Set(likert.map((r) => r.value_int)).size === 1;

  const flags: string[] = [];
  if (attnFail > 0) flags.push(`Failed ${attnFail} attention check${attnFail > 1 ? "s" : ""}`);
  if (fast >= 5) flags.push(`${fast} very fast answers (<1.5s)`);
  if (straightLine) flags.push("Straight-lined (same answer throughout)");

  const availability = (a.availability ?? {}) as Record<string, string[]>;
  const availDays = Object.entries(availability).filter(([, v]) => Array.isArray(v) && v.length);
  const workHistory = (a.work_history ?? []) as { employer: string; role: string; dates: string }[];
  const refs = (a.job_references ?? []) as { name: string; contact: string }[];

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

      <p className="mt-2 text-xs text-[color:var(--brand-ink-muted)]">
        Scoring isn&apos;t enabled yet — this shows raw responses and quality
        flags. Bands &amp; recommendations come with the scoring engine.
      </p>

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
              {workHistory.map((j, i) => (
                <li key={i}>
                  {[j.role, j.employer, j.dates].filter(Boolean).join(" · ")}
                </li>
              ))}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[color:var(--brand-ink-muted)]">{label}</dt>
      <dd className="font-semibold text-right">{value}</dd>
    </div>
  );
}
