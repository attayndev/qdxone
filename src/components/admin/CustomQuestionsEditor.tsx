"use client";

import { useState, useTransition } from "react";
import { saveCustomQuestions } from "@/app/admin/locations/actions";
import type { CustomQuestion, CustomQuestionType } from "@/lib/supabase/types";

const TYPE_LABELS: Record<CustomQuestionType, string> = {
  short_text: "Short answer",
  long_text: "Long answer",
  yes_no: "Yes / No",
};

const GATE_LABELS: Record<string, string> = {
  none: "Optional — just collect it",
  flag: "Flag for review if wrong",
  knockout: "Must-have (lowers their fit)",
  legal: "Legal requirement (age, etc.)",
};

// One-click legal age gates. Each is a Yes/No question that must be answered
// "Yes" — a "No" makes the candidate ineligible for that role.
const LEGAL_PRESETS: { label: string; button: string }[] = [
  { button: "16+ to work", label: "Are you 16 years or older?" },
  { button: "18+ to serve alcohol", label: "Are you 18 years or older? (required to serve alcohol)" },
  { button: "21+ to bartend", label: "Are you 21 years or older? (required to bartend)" },
];

export default function CustomQuestionsEditor({
  initial,
  roles,
  embedded = false,
}: {
  initial: CustomQuestion[];
  roles: string[];
  /** When true, drop the card + heading chrome (e.g. inside a lightbox). */
  embedded?: boolean;
}) {
  const [qs, setQs] = useState<CustomQuestion[]>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const add = () =>
    setQs((p) => [
      ...p,
      { id: crypto.randomUUID(), label: "", type: "short_text", required: false, roles: [] },
    ]);
  const addLegalPreset = (label: string) =>
    setQs((p) => [
      ...p,
      {
        id: crypto.randomUUID(),
        label,
        type: "yes_no",
        required: true,
        roles: [],
        gate: "legal",
        expected: "yes",
      },
    ]);
  const update = (id: string, patch: Partial<CustomQuestion>) =>
    setQs((p) => p.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const remove = (id: string) => setQs((p) => p.filter((q) => q.id !== id));

  const toggleRole = (q: CustomQuestion, role: string) => {
    const cur = q.roles ?? [];
    update(q.id, {
      roles: cur.includes(role) ? cur.filter((r) => r !== role) : [...cur, role],
    });
  };

  function save() {
    setSaved(false);
    startTransition(async () => {
      await saveCustomQuestions(qs);
      setSaved(true);
    });
  }

  return (
    <div className={embedded ? "" : "card mt-6 max-w-xl"}>
      {!embedded && (
        <>
          <h2 className="font-extrabold text-lg">Custom questions</h2>
          <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
            Extra questions on your application — anything specific to your
            restaurant (availability notes, transportation, certifications…).
          </p>
        </>
      )}

      <ul className={embedded ? "space-y-3" : "mt-4 space-y-3"}>
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

            {/* Answer requirement / gate */}
            <div className="rounded-lg bg-[color:var(--brand-cream)] p-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[color:var(--brand-ink-muted)]">
                If answered wrong:
              </span>
              <select
                className="input max-w-[230px] py-1.5 text-sm"
                value={q.gate ?? "none"}
                onChange={(e) => {
                  const g = e.target.value;
                  update(
                    q.id,
                    g === "none"
                      ? { gate: undefined, expected: undefined }
                      : {
                          gate: g as CustomQuestion["gate"],
                          expected: q.expected ?? (q.type === "yes_no" ? "yes" : ""),
                        }
                  );
                }}
              >
                {Object.entries(GATE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              {q.gate && (
                <label className="flex items-center gap-1.5 text-sm">
                  <span className="text-xs font-semibold text-[color:var(--brand-ink-muted)]">
                    Correct answer:
                  </span>
                  {q.type === "yes_no" ? (
                    <select
                      className="input py-1.5 text-sm max-w-[90px]"
                      value={q.expected ?? "yes"}
                      onChange={(e) => update(q.id, { expected: e.target.value })}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  ) : (
                    <input
                      className="input py-1.5 text-sm max-w-[140px]"
                      value={q.expected ?? ""}
                      onChange={(e) => update(q.id, { expected: e.target.value })}
                      placeholder="e.g. Yes"
                    />
                  )}
                </label>
              )}
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-[color:var(--brand-ink-muted)] mb-1">
                Applies to
              </div>
              {roles.length === 0 ? (
                <p className="text-xs text-[color:var(--brand-ink-muted)]">
                  All roles — define roles (in Roles) to scope a question to
                  specific ones.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  <Chip active={!q.roles?.length} onClick={() => update(q.id, { roles: [] })}>
                    All roles
                  </Chip>
                  {roles.map((r) => (
                    <Chip
                      key={r}
                      active={!!q.roles?.includes(r)}
                      onClick={() => toggleRole(q, r)}
                    >
                      {r}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* One-click legal age gates */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-[color:var(--brand-ink-muted)]">
          Add a legal age check:
        </span>
        {LEGAL_PRESETS.map((p) => (
          <button
            key={p.button}
            type="button"
            onClick={() => addLegalPreset(p.label)}
            className="chip cursor-pointer border border-[color:var(--brand-line)] bg-transparent hover:border-[color:var(--brand-blue)]"
          >
            + {p.button}
          </button>
        ))}
      </div>

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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip cursor-pointer border ${
        active
          ? "bg-[color:var(--brand-blue)] text-white border-transparent"
          : "bg-transparent text-[color:var(--brand-ink-muted)] border-[color:var(--brand-line)]"
      }`}
    >
      {children}
    </button>
  );
}
