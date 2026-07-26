"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addReview, changeRole, terminateEmployee } from "@/app/admin/employees/actions";
import { RATING_LABELS } from "@/lib/employees";

const RATINGS = [1, 2, 3, 4, 5];

export default function EmployeeActions({
  employeeId,
  status,
  currentRole,
  roles,
  nextReviewDue,
  reviewDue,
}: {
  employeeId: string;
  status: "employed" | "terminated";
  currentRole: string | null;
  roles: string[];
  nextReviewDue: string | null;
  reviewDue: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Add-review form state
  const [rating, setRating] = useState<number | null>(null);
  const [reviewRole, setReviewRole] = useState(currentRole ?? "");
  const [stillEmployed, setStillEmployed] = useState(true);
  const [termReason, setTermReason] = useState("");
  const [notes, setNotes] = useState("");

  // Change-role state
  const [showRole, setShowRole] = useState(false);
  const [newRole, setNewRole] = useState(currentRole ?? roles[0] ?? "");

  // Terminate state
  const [showTerm, setShowTerm] = useState(false);
  const [directTermReason, setDirectTermReason] = useState("");

  // The role list, guaranteeing the current role is selectable even if the org
  // later removes it from their list.
  const roleOptions =
    currentRole && !roles.includes(currentRole) ? [currentRole, ...roles] : roles;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.ok) {
        after?.();
        router.refresh();
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  function submitReview() {
    if (stillEmployed && rating === null) {
      setError("Pick a rating.");
      return;
    }
    const fd = new FormData();
    fd.set("employee_id", employeeId);
    fd.set("still_employed", stillEmployed ? "yes" : "no");
    fd.set("role_at_review", reviewRole);
    if (rating !== null) fd.set("rating", String(rating));
    if (!stillEmployed) fd.set("termination_reason", termReason);
    fd.set("notes", notes);
    run(() => addReview(fd), () => {
      setRating(null);
      setNotes("");
      setStillEmployed(true);
      setTermReason("");
    });
  }

  function submitRole() {
    const fd = new FormData();
    fd.set("employee_id", employeeId);
    fd.set("to_role", newRole);
    run(() => changeRole(fd), () => setShowRole(false));
  }

  function submitTerminate() {
    const fd = new FormData();
    fd.set("employee_id", employeeId);
    fd.set("termination_reason", directTermReason);
    run(() => terminateEmployee(fd), () => setShowTerm(false));
  }

  if (status === "terminated") {
    return error ? <div className="text-sm text-rose-600 mt-3">{error}</div> : null;
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Quarterly review */}
      <div className={"card " + (reviewDue ? "border-l-4 border-l-rose-500" : "")}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-extrabold text-lg">Performance review</h2>
          <span className="text-xs text-[color:var(--brand-ink-muted)]">
            {reviewDue
              ? "Due now"
              : nextReviewDue
                ? `Next due ${new Date(nextReviewDue).toLocaleDateString()}`
                : ""}
          </span>
        </div>

        <label className="label mt-3">
          Do they meet expectations of their current role?
        </label>
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={
                "px-3 py-2 rounded-lg border-2 text-sm font-semibold text-left flex-1 min-w-[130px] " +
                (rating === n
                  ? "border-[color:var(--brand-blue)] bg-[color:var(--brand-soft)]"
                  : "border-[color:var(--brand-line)] hover:border-[color:var(--brand-blue)]")
              }
            >
              <div className="text-base font-black">{n}</div>
              <div className="text-xs text-[color:var(--brand-ink-muted)]">
                {RATING_LABELS[n]}
              </div>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="label">Role at this review</label>
            <select
              className="input"
              value={reviewRole}
              onChange={(ev) => setReviewRole(ev.target.value)}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Still employed?</label>
            <select
              className="input"
              value={stillEmployed ? "yes" : "no"}
              onChange={(ev) => setStillEmployed(ev.target.value === "yes")}
            >
              <option value="yes">Yes — still with us</option>
              <option value="no">No — no longer employed</option>
            </select>
          </div>
        </div>

        {!stillEmployed && (
          <div className="mt-3">
            <label className="label">Reason for leaving</label>
            <input
              className="input"
              value={termReason}
              onChange={(ev) => setTermReason(ev.target.value)}
              placeholder="e.g. voluntary resignation, attendance, moved away"
            />
          </div>
        )}

        <div className="mt-3">
          <label className="label">Notes</label>
          <textarea
            className="input"
            rows={3}
            value={notes}
            onChange={(ev) => setNotes(ev.target.value)}
            placeholder="What's going well, what to work on…"
          />
        </div>

        <button
          type="button"
          onClick={submitReview}
          disabled={pending}
          className="btn-primary mt-3"
        >
          {pending ? "Saving…" : stillEmployed ? "Save review" : "Save & mark departed"}
        </button>
      </div>

      {/* Change role + terminate */}
      <div className="flex flex-wrap gap-2">
        {!showRole ? (
          <button type="button" className="btn-ghost" onClick={() => setShowRole(true)}>
            Change role / promote
          </button>
        ) : (
          <div className="card w-full">
            <label className="label">New role</label>
            <div className="flex flex-wrap gap-2">
              <select
                className="input flex-1 min-w-[180px]"
                value={newRole}
                onChange={(ev) => setNewRole(ev.target.value)}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button type="button" className="btn-primary" onClick={submitRole} disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowRole(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {!showTerm ? (
          <button type="button" className="btn-ghost" onClick={() => setShowTerm(true)}>
            Mark terminated
          </button>
        ) : (
          <div className="card w-full">
            <label className="label">Reason for termination</label>
            <div className="flex flex-wrap gap-2">
              <input
                className="input flex-1 min-w-[180px]"
                value={directTermReason}
                onChange={(ev) => setDirectTermReason(ev.target.value)}
                placeholder="e.g. attendance, performance, voluntary"
              />
              <button type="button" className="btn-primary" onClick={submitTerminate} disabled={pending}>
                {pending ? "Saving…" : "Confirm"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowTerm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}
    </div>
  );
}
