"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addReview, changeRole, terminateEmployee } from "@/app/admin/employees/actions";
import { RATING_LABELS } from "@/lib/employees";
import { REVIEW_CATEGORIES } from "@/lib/review-categories";

const RATINGS = [1, 2, 3, 4, 5];

/** A compact 1–5 rating select with labels; "" = not rated. */
function RatingSelect({
  value,
  onChange,
  blankLabel = "— not rated —",
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  blankLabel?: string;
}) {
  return (
    <select
      className="input"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">{blankLabel}</option>
      {RATINGS.map((n) => (
        <option key={n} value={n}>
          {n} · {RATING_LABELS[n]}
        </option>
      ))}
    </select>
  );
}

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
  const [rating, setRating] = useState<number | null>(null); // overall
  const [catRatings, setCatRatings] = useState<Record<string, number | null>>({});
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
      setError("Pick an overall rating.");
      return;
    }
    const fd = new FormData();
    fd.set("employee_id", employeeId);
    fd.set("still_employed", stillEmployed ? "yes" : "no");
    fd.set("role_at_review", reviewRole);
    if (rating !== null) fd.set("rating", String(rating));
    for (const c of REVIEW_CATEGORIES) {
      const v = catRatings[c.column];
      if (v != null) fd.set(c.column, String(v));
    }
    if (!stillEmployed) fd.set("termination_reason", termReason);
    fd.set("notes", notes);
    run(() => addReview(fd), () => {
      setRating(null);
      setCatRatings({});
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

        <p className="text-sm text-[color:var(--brand-ink-muted)] mt-3">
          Rate them on the same dimensions the assessment measures — this is what
          lets you see whether the assessment predicted how they&apos;d do.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          {REVIEW_CATEGORIES.map((c) => (
            <div key={c.column}>
              <label className="label">{c.label}</label>
              <RatingSelect
                value={catRatings[c.column] ?? null}
                onChange={(v) => setCatRatings((prev) => ({ ...prev, [c.column]: v }))}
              />
            </div>
          ))}
        </div>

        <div className="mt-3">
          <label className="label">Overall — do they meet expectations of their role?</label>
          <RatingSelect value={rating} onChange={setRating} blankLabel="— select —" />
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
