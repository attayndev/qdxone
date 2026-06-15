"use client";

import { useState, useTransition } from "react";
import { saveAssessmentMode } from "@/app/admin/locations/actions";

export default function AssessmentModeToggle({
  autoSend,
}: {
  autoSend: boolean;
}) {
  const [on, setOn] = useState(autoSend);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function set(value: boolean) {
    setOn(value);
    setSaved(false);
    startTransition(async () => {
      await saveAssessmentMode(value);
      setSaved(true);
    });
  }

  return (
    <div className="card mt-6 max-w-xl">
      <h2 className="font-extrabold text-lg">When to send the assessment</h2>
      <div className="mt-3 space-y-2">
        <Option
          selected={on}
          onClick={() => set(true)}
          title="Automatically (recommended)"
          body="Candidates go straight into the assessment after applying. Highest completion — and joke applicants who don't finish just drop off your list."
        />
        <Option
          selected={!on}
          onClick={() => set(false)}
          title="I'll review applications first"
          body="Applications land in your pipeline as “New” with no assessment. You click “Send assessment” on the real ones — joke applications get deleted before any assessment exists."
        />
      </div>
      {pending ? (
        <p className="mt-2 text-sm text-[color:var(--brand-ink-muted)]">Saving…</p>
      ) : saved ? (
        <p className="mt-2 text-sm text-emerald-700">Saved.</p>
      ) : null}
    </div>
  );
}

function Option({
  selected,
  onClick,
  title,
  body,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left rounded-2xl p-4 border-2 transition",
        selected
          ? "border-[color:var(--brand-pink)] bg-[color:var(--brand-pink-50)]"
          : "border-[color:var(--brand-line)] bg-white hover:border-[color:var(--brand-pink)]/60",
      ].join(" ")}
    >
      <div className="font-bold">{title}</div>
      <div className="text-sm text-[color:var(--brand-ink-muted)] mt-0.5">{body}</div>
    </button>
  );
}
