"use client";

import { useState } from "react";
import { setCandidateDecision } from "@/app/admin/candidates/actions";
import { DECISIONS, decisionReasons, type Decision } from "@/lib/candidate-decision";

const ADD_NEW = "__add_new__";

export default function DecisionControl({
  applicationId,
  initialDecision,
  initialReason,
  initialNotes,
  reasonOptions,
  decidedLabel,
}: {
  applicationId: string;
  initialDecision: Decision | null;
  initialReason: string;
  initialNotes: string;
  /** The org's editable reason list (falls back to defaults). */
  reasonOptions: string[];
  /** e.g. "Decided May 4 by jane@store.com" — shown when a decision exists. */
  decidedLabel?: string | null;
}) {
  const options = decisionReasons(reasonOptions);
  // If a past decision used a reason no longer in the list, keep it selectable.
  const allOptions =
    initialReason && !options.includes(initialReason)
      ? [initialReason, ...options]
      : options;

  const [decision, setDecision] = useState<Decision | "">(initialDecision ?? "");
  const [reason, setReason] = useState(initialReason);
  const [addingReason, setAddingReason] = useState(false);
  const [newReason, setNewReason] = useState("");
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const finalReason = addingReason ? newReason.trim() : reason;
    const res = await setCandidateDecision(
      applicationId,
      decision || null,
      finalReason,
      notes
    );
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      // Reflect a freshly-added reason in the dropdown without a reload.
      if (addingReason && finalReason) {
        setReason(finalReason);
        setAddingReason(false);
        setNewReason("");
      }
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="card">
      <h2 className="font-extrabold text-lg">Decision</h2>
      {decidedLabel && (
        <p className="text-xs text-[color:var(--brand-ink-muted)] mt-0.5">{decidedLabel}</p>
      )}

      <label className="block mt-3">
        <span className="label">Outcome</span>
        <select
          className="input"
          value={decision}
          onChange={(e) => {
            setSaved(false);
            setDecision(e.target.value as Decision | "");
          }}
        >
          <option value="">No decision yet</option>
          {DECISIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block mt-3">
        <span className="label">Reason</span>
        {addingReason ? (
          <div className="flex gap-2">
            <input
              className="input flex-1"
              autoFocus
              value={newReason}
              onChange={(e) => {
                setSaved(false);
                setNewReason(e.target.value);
              }}
              placeholder="Type a new reason"
            />
            <button
              type="button"
              className="btn-ghost whitespace-nowrap"
              onClick={() => {
                setAddingReason(false);
                setNewReason("");
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <select
            className="input"
            value={reason}
            onChange={(e) => {
              setSaved(false);
              if (e.target.value === ADD_NEW) {
                setAddingReason(true);
                setReason("");
              } else {
                setReason(e.target.value);
              }
            }}
          >
            <option value="">No reason</option>
            {allOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
            <option value={ADD_NEW}>➕ Add a new reason…</option>
          </select>
        )}
      </label>

      <label className="block mt-3">
        <span className="label">Notes</span>
        <textarea
          className="input"
          rows={3}
          value={notes}
          onChange={(e) => {
            setSaved(false);
            setNotes(e.target.value);
          }}
          placeholder="Anything worth remembering for the record (optional)."
        />
      </label>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save decision"}
        </button>
        {saved && <span className="text-sm text-emerald-700 font-medium">Saved.</span>}
      </div>
    </div>
  );
}
