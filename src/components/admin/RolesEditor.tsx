"use client";

import { useState, useTransition } from "react";
import { saveRoles } from "@/app/admin/locations/actions";

/**
 * Operator-defined role list. Roles are org-specific (a froyo shop's roles
 * differ from a burger joint's), so there's no universal set — the operator
 * curates their own here, and postings pick from it.
 */
export default function RolesEditor({ initialRoles }: { initialRoles: string[] }) {
  const [roles, setRoles] = useState<string[]>(
    initialRoles.length ? initialRoles : [""]
  );
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const update = (i: number, v: string) =>
    setRoles((r) => r.map((x, j) => (j === i ? v : x)));
  const add = () => setRoles((r) => [...r, ""]);
  const remove = (i: number) =>
    setRoles((r) => (r.length > 1 ? r.filter((_, j) => j !== i) : r));

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await saveRoles(roles);
      setMsg(
        res.ok
          ? { ok: true, text: "Roles saved." }
          : { ok: false, text: res.error }
      );
    });
  }

  return (
    <div className="card mt-6 max-w-xl">
      <h2 className="font-extrabold text-lg">Roles</h2>
      <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
        The positions you hire for. Postings pick from this list, and each
        candidate&apos;s role is recorded for role-based benchmarking later.
      </p>
      <ul className="mt-4 space-y-2">
        {roles.map((role, i) => (
          <li key={i} className="flex gap-2">
            <input
              className="input flex-1"
              value={role}
              onChange={(e) => update(i, e.target.value)}
              placeholder="e.g. Team Member"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="px-3 text-sm font-semibold text-red-600 hover:underline"
              aria-label="Remove role"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
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
        {msg && (
          <span
            className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}
          >
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
