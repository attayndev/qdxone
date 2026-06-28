"use client";

import { useState } from "react";
import { setCandidateDecision } from "@/app/admin/candidates/actions";
import { DECISIONS, type Decision } from "@/lib/candidate-decision";

export default function DecisionControl({
  applicationId,
  initialDecision,
  initialReason,
  decidedLabel,
}: {
  applicationId: string;
  initialDecision: Decision | null;
  initialReason: string;
  /** e.g. "Decided May 4 by jane@store.com" — shown when a decision exists. */
  decidedLabel?: string | null;
}) {
  const [decision, setDecision] = useState<Decision | "">(initialDecision ?? "");
  const [reason, setReason] = useState(initialReason);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await setCandidateDecision(applicationId, decision || null, reason);
    setSaving(false);
    if (res.ok) setSaved(true);
    else setError(res.error);
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
        <span className="label">Reason / notes</span>
        <textarea
          className="input"
          rows={3}
          value={reason}
          onChange={(e) => {
            setSaved(false);
            setReason(e.target.value);
          }}
          placeholder="Why — e.g. great availability and attitude; or: no-show; or: roles filled."
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
