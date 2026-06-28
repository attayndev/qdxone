"use client";

import { useState, useTransition } from "react";
import {
  saveInterviewType,
  removeInterviewType,
} from "@/app/admin/scheduling/actions";
import type { InterviewType } from "@/lib/scheduling/templates";

const MEETING_LABELS: Record<string, string> = {
  in_person: "In person",
  phone: "Phone call",
  google_meet: "Google Meet (video)",
};
const DURATIONS = [15, 20, 30, 45, 60];
const NOTICE = [
  { v: 0, label: "No minimum" },
  { v: 120, label: "2 hours" },
  { v: 240, label: "4 hours" },
  { v: 720, label: "12 hours" },
  { v: 1440, label: "1 day" },
  { v: 2880, label: "2 days" },
];
const BUFFERS = [0, 5, 10, 15, 30];

function blank(): InterviewType {
  return {
    id: "",
    name: "",
    durationMinutes: 30,
    meetingType: "in_person",
    meetingLocation: null,
    minNoticeMinutes: 240,
    maxAdvanceDays: 21,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    candidateInstructions: null,
    isActive: true,
    interviewerId: null,
  };
}

export default function InterviewTypes({
  types,
  calendarConnected,
  defaultLocation,
}: {
  types: InterviewType[];
  calendarConnected: boolean;
  defaultLocation: string | null;
}) {
  const [editing, setEditing] = useState<InterviewType | null>(null);

  return (
    <div className="space-y-3 max-w-2xl">
      {types.length === 0 && !editing && (
        <p className="text-sm text-[color:var(--brand-ink-muted)]">
          No interview types yet. Add one to describe how you&apos;ll meet
          candidates (e.g. a 15-minute phone screen or a 30-minute in-person).
        </p>
      )}

      {types.map((t) => (
        <div key={t.id} className="card flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">{t.name}</div>
            <div className="text-sm text-[color:var(--brand-ink-muted)]">
              {t.durationMinutes} min · {MEETING_LABELS[t.meetingType] ?? t.meetingType}
              {t.meetingType === "in_person" && t.meetingLocation ? ` · ${t.meetingLocation}` : ""}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setEditing(t)}
              className="rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5"
            >
              Edit
            </button>
            <DeleteButton id={t.id} name={t.name} />
          </div>
        </div>
      ))}

      {editing ? (
        <TypeForm
          key={editing.id || "new"}
          value={editing}
          calendarConnected={calendarConnected}
          defaultLocation={defaultLocation}
          onDone={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing(blank())} className="btn-primary">
          + Add interview type
        </button>
      )}
    </div>
  );
}

function DeleteButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete "${name}"? Candidates can no longer book it.`)) return;
        start(() => removeInterviewType(id));
      }}
      className="rounded-lg border border-red-200 text-red-700 px-3 py-1.5 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
    >
      Delete
    </button>
  );
}

function TypeForm({
  value,
  calendarConnected,
  defaultLocation,
  onDone,
}: {
  value: InterviewType;
  calendarConnected: boolean;
  defaultLocation: string | null;
  onDone: () => void;
}) {
  const [meetingType, setMeetingType] = useState(value.meetingType);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setErr(null);
    start(async () => {
      const r = await saveInterviewType(formData);
      if (r.ok) onDone();
      else setErr(r.error);
    });
  }

  return (
    <form action={onSubmit} className="card space-y-4">
      <input type="hidden" name="id" defaultValue={value.id} />
      <div>
        <label className="label">Name</label>
        <input
          name="name"
          className="input"
          placeholder="e.g. Phone screen"
          defaultValue={value.name}
          required
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Length</label>
          <select name="durationMinutes" className="input" defaultValue={value.durationMinutes}>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} minutes
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">How you&apos;ll meet</label>
          <select
            name="meetingType"
            className="input"
            value={meetingType}
            onChange={(e) => setMeetingType(e.target.value as InterviewType["meetingType"])}
          >
            <option value="in_person">In person</option>
            <option value="phone">Phone call</option>
            <option value="google_meet" disabled={!calendarConnected}>
              Google Meet (video){calendarConnected ? "" : " — connect calendar first"}
            </option>
          </select>
        </div>
      </div>

      {meetingType === "in_person" && (
        <div>
          <label className="label">Where</label>
          <input
            name="meetingLocation"
            className="input"
            placeholder="e.g. store address"
            defaultValue={value.meetingLocation ?? defaultLocation ?? ""}
          />
        </div>
      )}

      <div>
        <label className="label">Note to the candidate (optional)</label>
        <textarea
          name="candidateInstructions"
          className="input"
          rows={2}
          placeholder="e.g. Ask for the manager at the counter."
          defaultValue={value.candidateInstructions ?? ""}
        />
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer font-medium">Advanced scheduling rules</summary>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="label">Minimum notice</label>
            <select name="minNoticeMinutes" className="input" defaultValue={value.minNoticeMinutes}>
              {NOTICE.map((n) => (
                <option key={n.v} value={n.v}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Bookable up to (days out)</label>
            <input
              name="maxAdvanceDays"
              type="number"
              min={1}
              max={365}
              className="input"
              defaultValue={value.maxAdvanceDays}
            />
          </div>
          <div>
            <label className="label">Buffer before</label>
            <select name="bufferBeforeMinutes" className="input" defaultValue={value.bufferBeforeMinutes}>
              {BUFFERS.map((b) => (
                <option key={b} value={b}>
                  {b} min
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Buffer after</label>
            <select name="bufferAfterMinutes" className="input" defaultValue={value.bufferAfterMinutes}>
              {BUFFERS.map((b) => (
                <option key={b} value={b}>
                  {b} min
                </option>
              ))}
            </select>
          </div>
        </div>
      </details>

      {err && <p className="text-red-700 text-sm">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
