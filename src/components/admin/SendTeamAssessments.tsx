"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendTeamAssessments } from "@/app/admin/employees/actions";

/** Banner nudging the operator to benchmark everyone who hasn't been assessed. */
export default function SendTeamAssessments({ count }: { count: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function send() {
    setError(null);
    start(async () => {
      const res = await sendTeamAssessments();
      if (res.ok) {
        setResult(`Sent the assessment to ${res.sent} employee${res.sent === 1 ? "" : "s"}.`);
        router.refresh();
      } else setError(res.error);
    });
  }

  return (
    <div className="card mt-4 border-l-4 border-l-[color:var(--brand-blue)] flex items-center justify-between gap-3 flex-wrap">
      <div>
        <div className="font-bold">Benchmark your whole team</div>
        <div className="text-sm text-[color:var(--brand-ink-muted)]">
          {count} employee{count === 1 ? " hasn't" : "s haven't"} taken the assessment. Send it to
          them to see how your team scores — and validate the assessment against real performance.
        </div>
        {result && <div className="text-sm text-emerald-700 mt-1">{result}</div>}
        {error && <div className="text-sm text-rose-600 mt-1">{error}</div>}
      </div>
      <button className="btn-primary whitespace-nowrap" onClick={send} disabled={pending}>
        {pending ? "Sending…" : `Send to ${count}`}
      </button>
    </div>
  );
}
