"use client";

import { useState, useTransition } from "react";
import {
  saveRoles,
  generateRoleDescription,
} from "@/app/admin/locations/actions";
import type { RoleDetail } from "@/lib/roles";

/**
 * Operator-defined roles, each with an optional job description (AI-draftable).
 */
export default function RolesEditor({ initial }: { initial: RoleDetail[] }) {
  const [roles, setRoles] = useState<RoleDetail[]>(
    initial.length ? initial : [{ name: "", description: "" }]
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [aiIdx, setAiIdx] = useState<number | null>(null);
  const [aiErr, setAiErr] = useState<string | null>(null);

  const update = (i: number, patch: Partial<RoleDetail>) =>
    setRoles((p) => p.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const add = () =>
    setRoles((p) => [...p, { name: "", description: "" }]);
  const remove = (i: number) =>
    setRoles((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : p));

  function save() {
    setSaved(false);
    startTransition(async () => {
      await saveRoles(roles);
      setSaved(true);
    });
  }

  async function writeAi(i: number) {
    setAiErr(null);
    setAiIdx(i);
    const res = await generateRoleDescription(roles[i].name, roles[i].description);
    setAiIdx(null);
    if (res.ok) update(i, { description: res.text });
    else setAiErr(res.error);
  }

  return (
    <div className="card mt-6 max-w-xl">
      <h2 className="font-extrabold text-lg">Roles</h2>
      <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
        The positions you hire for. Add a job description candidates see on the
        posting — or jot a few notes and let AI draft it.
      </p>

      <ul className="mt-4 space-y-4">
        {roles.map((role, i) => (
          <li
            key={i}
            className="rounded-xl border border-[color:var(--brand-line)] p-3 space-y-2"
          >
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={role.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="e.g. Team Member"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="px-3 text-sm font-semibold text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
            <textarea
              className="input min-h-[80px]"
              value={role.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder="Job description (or a few notes, then click ✨ Write with AI)"
            />
            <button
              type="button"
              disabled={aiIdx === i || !role.name.trim()}
              onClick={() => writeAi(i)}
              className="text-sm font-semibold text-[color:var(--brand-pink-600)] hover:underline disabled:opacity-40"
            >
              {aiIdx === i ? "Writing…" : "✨ Write with AI"}
            </button>
          </li>
        ))}
      </ul>

      {aiErr && <p className="mt-2 text-sm text-red-600">{aiErr}</p>}

      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={add} className="btn-ghost">
          + Add role
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="btn-primary"
        >
          {pending ? "Saving…" : "Save roles"}
        </button>
        {saved && <span className="text-sm text-emerald-700">Saved.</span>}
      </div>
    </div>
  );
}
