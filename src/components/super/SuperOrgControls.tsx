"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOrgSuspended, deleteOrg } from "@/app/super/actions";

/** Platform-staff controls for one org: suspend/unsuspend + permanent delete. */
export default function SuperOrgControls({
  orgId,
  slug,
  suspended,
  isDemo,
}: {
  orgId: string;
  slug: string;
  suspended: boolean;
  isDemo: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");

  function toggleSuspend() {
    setErr(null);
    start(async () => {
      const r = await setOrgSuspended(orgId, !suspended);
      if (r.ok) router.refresh();
      else setErr(r.error ?? "Failed.");
    });
  }

  function remove() {
    setErr(null);
    if (!window.confirm(`Permanently delete "${slug}" and ALL its data? This cannot be undone.`)) return;
    start(async () => {
      const r = await deleteOrg(orgId, confirm);
      if (r.ok) router.push("/super");
      else setErr(r.error ?? "Failed.");
    });
  }

  return (
    <div className="card border-rose-200">
      <h2 className="font-extrabold text-lg text-rose-700">Danger zone</h2>

      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <div className="font-semibold">{suspended ? "Suspended" : "Active"}</div>
          <div className="text-[color:var(--brand-ink-muted)]">
            {suspended
              ? "The operator can't use the admin until you restore it."
              : "Suspending blocks the operator's admin (careers page stays up)."}
          </div>
        </div>
        <button
          type="button"
          onClick={toggleSuspend}
          disabled={pending}
          className={
            "rounded-lg px-3 py-1.5 text-sm font-semibold border disabled:opacity-50 " +
            (suspended
              ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              : "border-amber-300 text-amber-800 hover:bg-amber-50")
          }
        >
          {pending ? "…" : suspended ? "Unsuspend" : "Suspend"}
        </button>
      </div>

      {!isDemo && (
        <div className="mt-5 border-t border-[color:var(--brand-line)] pt-4">
          <div className="text-sm font-semibold">Delete organization</div>
          <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
            Permanently removes the org and all its candidates, postings, and
            assessments. Type <span className="font-mono font-bold">{slug}</span> to confirm.
          </p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={slug}
              className="input max-w-[220px] py-1.5 text-sm font-mono"
            />
            <button
              type="button"
              onClick={remove}
              disabled={pending || confirm.trim() !== slug}
              className="rounded-lg border border-rose-300 text-rose-700 px-3 py-1.5 text-sm font-semibold hover:bg-rose-50 disabled:opacity-40"
            >
              Delete permanently
            </button>
          </div>
        </div>
      )}

      {err && <p className="text-sm text-rose-600 mt-3">{err}</p>}
    </div>
  );
}
