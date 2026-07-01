"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CANDIDATE_VIEWS, asView } from "@/lib/candidate-filter";

/**
 * Candidate list filter: one search box + a single row of one-tap "view" chips.
 * Replaces the old three-dropdowns-plus-checkbox. State lives in the URL
 * (`view`, `q`); the page renders the matching list server-side.
 */
export default function CandidateFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const view = asView(sp.get("view"));

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

  return (
    <div className="mt-6 space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, email, or role"
        className="input w-full sm:w-80"
      />
      <div className="flex flex-wrap gap-2">
        {CANDIDATE_VIEWS.map((v) => {
          const active = v.key === view;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => push({ view: v.key })}
              className={
                "rounded-full px-4 py-1.5 text-sm font-semibold border transition " +
                (active
                  ? "bg-[color:var(--brand-blue)] text-white border-[color:var(--brand-blue)]"
                  : "bg-white text-[color:var(--brand-ink)] border-[color:var(--brand-line)] hover:border-[color:var(--brand-blue)]")
              }
            >
              {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
