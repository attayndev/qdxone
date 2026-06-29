"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const STATUSES = [
  { v: "", label: "All stages" },
  { v: "new", label: "New" },
  { v: "assessment_sent", label: "Assessment sent" },
  { v: "assessment_complete", label: "Assessment complete" },
  { v: "decision_made", label: "Decision made" },
];
const DECISIONS = [
  { v: "", label: "Any decision" },
  { v: "hired", label: "Hired" },
  { v: "not_hired", label: "Not hired" },
  { v: "declined", label: "Declined" },
];

export default function CandidateFilters({ roles }: { roles: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function push(next: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`/admin/candidates?${params.toString()}`);
  }

  // Debounce the free-text search.
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      if ((sp.get("q") ?? "") !== q) push({ q });
    }, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const showDecided = sp.get("show") === "all";
  const status = sp.get("status") ?? "";
  const role = sp.get("role") ?? "";
  const decision = sp.get("decision") ?? "";

  return (
    <div className="flex flex-wrap items-center gap-2 mt-6">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name or email"
        className="input w-56"
      />
      <select className="input w-auto" value={status} onChange={(e) => push({ status: e.target.value })}>
        {STATUSES.map((s) => (
          <option key={s.v} value={s.v}>{s.label}</option>
        ))}
      </select>
      {roles.length > 0 && (
        <select className="input w-auto" value={role} onChange={(e) => push({ role: e.target.value })}>
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      )}
      <select className="input w-auto" value={decision} onChange={(e) => push({ decision: e.target.value })}>
        {DECISIONS.map((d) => (
          <option key={d.v} value={d.v}>{d.label}</option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm text-[color:var(--brand-ink-muted)] ml-1">
        <input
          type="checkbox"
          checked={showDecided}
          onChange={(e) => push({ show: e.target.checked ? "all" : "" })}
        />
        Include decided
      </label>
    </div>
  );
}
