"use client";

import { useState, useTransition } from "react";
import { saveCustomQuestions } from "@/app/admin/locations/actions";
import type { CustomQuestion, CustomQuestionType } from "@/lib/supabase/types";

const TYPE_LABELS: Record<CustomQuestionType, string> = {
  short_text: "Short answer",
  long_text: "Long answer",
  yes_no: "Yes / No",
};

export default function CustomQuestionsEditor({
  initial,
}: {
  initial: CustomQuestion[];
}) {
  const [qs, setQs] = useState<CustomQuestion[]>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const add = () =>
    setQs((p) => [
      ...p,
      { id: crypto.randomUUID(), label: "", type: "short_text", required: false },
    ]);
  const update = (id: string, patch: Partial<CustomQuestion>) =>
    setQs((p) => p.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const remove = (id: string) => setQs((p) => p.filter((q) => q.id !== id));

  function save() {
    setSaved(false);
    startTransition(async () => {
      await saveCustomQuestions(qs);
      setSaved(true);
    });
  }

  return (
    <div className="card mt-6 max-w-xl">
      <h2 className="font-extrabold text-lg">Custom questions</h2>
      <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
        Extra questions on your application — anything specific to your
        restaurant (availability notes, transportation, certifications…).
      </p>

      <ul className="mt-4 space-y-3">
        {qs.length === 0 && (
          <li className="text-sm text-[color:var(--brand-ink-muted)]">
            No custom questions yet.
          </li>
        )}
        {qs.map((q) => (
          <li
            key={q.id}
            className="rounded-xl border border-[color:var(--brand-line)] p-3 space-y-2"
          >
            <input
              className="input"
              value={q.label}
              onChange={(e) => update(q.id, { label: e.target.value })}
              placeholder="e.g. Do you have reliable transportation?"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <select
                className="input max-w-[160px] py-2"
                value={q.type}
                onChange={(e) =>
                  update(q.id, { type: e.target.value as CustomQuestionType })
                }
              >
                {(Object.keys(TYPE_LABELS) as CustomQuestionType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => update(q.id, { required: e.target.checked })}
                />
                Required
              </label>
              <button
                type="button"
                onClick={() => remove(q.id)}
                className="ml-auto text-sm font-semibold text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={add} className="btn-ghost">
          + Add question
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="btn-primary"
        >
          {pending ? "Saving…" : "Save questions"}
        </button>
        {saved && <span className="text-sm text-emerald-700">Saved.</span>}
      </div>
    </div>
  );
}
