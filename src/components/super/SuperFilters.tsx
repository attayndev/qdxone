"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const STATUSES: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "active", label: "Active" },
  { key: "trialing", label: "Trial" },
  { key: "past_due", label: "Past due" },
  { key: "canceled", label: "Canceled" },
];

/** Org list filter: search + status chips (same pattern as the candidate list). */
export function SuperFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const status = sp.get("status") ?? "";

  function push(next: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`/super?${params.toString()}`);
  }

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
    <div className="mt-2 mb-4 space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or subdomain"
        className="input w-full sm:w-80"
      />
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const on = s.key === status;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => push({ status: s.key })}
              className={
                "rounded-full px-4 py-1.5 text-sm font-semibold border transition " +
                (on
                  ? "bg-[color:var(--brand-blue)] text-white border-[color:var(--brand-blue)]"
                  : "bg-white text-[color:var(--brand-ink)] border-[color:var(--brand-line)] hover:border-[color:var(--brand-blue)]")
              }
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
