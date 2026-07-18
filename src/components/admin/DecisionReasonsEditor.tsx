"use client";

import { useState, useTransition } from "react";
import { saveDecisionReasons } from "@/app/admin/locations/actions";
import { decisionReasons } from "@/lib/candidate-decision";

/**
 * The operator-editable pick-list behind the "Reason" dropdown on the candidate
 * decision panel (web + mobile). Add, rename, remove, reorder. Falls back to
 * sensible defaults when empty. Managers can still add a reason on the fly from
 * the decision panel — this is the place to curate the whole list.
 */
export default function DecisionReasonsEditor({
  initial,
}: {
  initial: string[];
}) {
  // Seed the editor with the org's list, or the defaults if they haven't set one.
  const [reasons, setReasons] = useState<string[]>(
    initial.length ? initial : decisionReasons(null)
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const update = (i: number, value: string) =>
    setReasons((p) => p.map((r, j) => (j === i ? value : r)));
  const add = () => setReasons((p) => [...p, ""]);
  const remove = (i: number) => setReasons((p) => p.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) =>
    setReasons((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  function save() {
    setSaved(false);
    startTransition(async () => {
      await saveDecisionReasons(reasons);
      setSaved(true);
    });
  }

  return (
    <div className="card mt-6 max-w-xl">
      <h2 className="font-extrabold text-lg">Decision reasons</h2>
      <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
        The choices in the <strong>Reason</strong> dropdown when you record a
        hiring decision on a candidate. Reorder them, rename them, or remove
        ones you never use. Leave it empty to use our defaults.
      </p>

      <ul className="mt-4 space-y-2">
        {reasons.map((reason, i) => (
          <li key={i} className="flex items-center gap-2">
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move up"
                className="text-xs leading-none text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-blue)] disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === reasons.length - 1}
                aria-label="Move down"
                className="text-xs leading-none text-[color:var(--brand-ink-muted)] hover:text-[color:var(--brand-blue)] disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            <input
              className="input flex-1"
              value={reason}
              onChange={(e) => update(i, e.target.value)}
              placeholder="e.g. Availability didn't fit"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="px-2 text-sm font-semibold text-red-600 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={add} className="btn-ghost">
          + Add reason
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="btn-primary"
        >
          {pending ? "Saving…" : "Save reasons"}
        </button>
        {saved && <span className="text-sm text-emerald-700">Saved.</span>}
      </div>
    </div>
  );
}
