"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { RenderItem } from "@/lib/assessment/session";
import { saveResponse, completeAssessment } from "@/app/a/[token]/actions";

type Answered = Record<string, { value_int: number | null; value_text: string | null }>;

export default function AssessmentRunner({
  token,
  items,
  answered,
}: {
  token: string;
  items: RenderItem[];
  answered: Answered;
}) {
  // Resume at the first unanswered item.
  const startIndex = useMemo(() => {
    const i = items.findIndex((it) => !(it.itemId in answered));
    return i === -1 ? items.length : i;
  }, [items, answered]);

  const [index, setIndex] = useState(startIndex);
  const [done, setDone] = useState(startIndex >= items.length);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const shownAt = useRef(Date.now());

  useEffect(() => {
    shownAt.current = Date.now();
    setText("");
  }, [index]);

  if (done) {
    return (
      <div className="max-w-lg mx-auto card text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-3 text-3xl font-black tracking-tight">All done!</h1>
        <p className="mt-3 text-[color:var(--brand-ink-muted)]">
          Thanks for finishing. The manager will review everything and reach
          out if it&apos;s a fit. You can close this tab.
        </p>
      </div>
    );
  }

  const item = items[index];
  const total = items.length;
  const pct = (index / total) * 100;

  function record(value_int: number | null, value_text: string | null) {
    const response_ms = Date.now() - shownAt.current;
    const kind =
      item.kind === "attention"
        ? "attention_check"
        : item.kind === "likert"
          ? "personality"
          : "screener";
    const save = saveResponse(token, {
      item_id: item.itemId,
      item_kind: kind,
      value_int,
      value_text,
      response_ms,
      sequence: index,
    });

    if (index >= total - 1) {
      startTransition(async () => {
        await save;
        await completeAssessment(token);
        setDone(true);
      });
    } else {
      void save;
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <div className="h-2 rounded-full bg-[color:var(--brand-line)] overflow-hidden">
          <div
            className="h-full bg-[color:var(--brand-pink)] transition-all"
            style={{ width: `${Math.max(4, pct)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-[color:var(--brand-ink-muted)]">
          <span>{index + 1} of {total}</span>
          <span>About 5 minutes</span>
        </div>
      </div>

      <div className="card">
        {(item.kind === "likert" || item.kind === "attention") && (
          <>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
              {item.text}
            </h2>
            <Likert disabled={pending} onPick={(n) => record(n, null)} />
          </>
        )}

        {item.kind === "screener_single" && (
          <>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
              {item.question}
            </h2>
            <div className="mt-5 space-y-2.5">
              {item.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  disabled={pending}
                  onClick={() => record(o.value, null)}
                  className="w-full text-left rounded-2xl px-4 py-3 border border-[color:var(--brand-line)] bg-white hover:border-[color:var(--brand-pink)] transition"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}

        {item.kind === "screener_text" && (
          <>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
              {item.question}
            </h2>
            <textarea
              className="input min-h-[120px] mt-4"
              value={text}
              maxLength={200}
              onChange={(e) => setText(e.target.value)}
              placeholder="Optional"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => record(null, text.trim() || null)}
              className="btn-primary w-full mt-4"
            >
              {index >= total - 1 ? "Finish" : "Continue"}
            </button>
          </>
        )}
      </div>

      <p className="mt-4 text-xs text-[color:var(--brand-ink-muted)] text-center">
        Answer honestly — there are no trick questions. Your link stays valid
        for 72 hours if you need to step away.
      </p>
    </div>
  );
}

function Likert({
  onPick,
  disabled,
}: {
  onPick: (n: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onPick(n)}
            className="flex-1 h-12 rounded-xl border-2 border-[color:var(--brand-line)] bg-white font-bold text-lg hover:border-[color:var(--brand-pink)] hover:bg-[color:var(--brand-pink-50)] transition disabled:opacity-50"
            aria-label={`${n} of 5`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-[color:var(--brand-ink-muted)]">
        <span>Strongly disagree</span>
        <span>Strongly agree</span>
      </div>
    </div>
  );
}
