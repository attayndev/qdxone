"use client";

import { useState, useTransition } from "react";
import { saveApplicationConfig } from "@/app/admin/locations/actions";
import type { ApplicationConfig } from "@/lib/application-config";

type Mode = "hidden" | "optional" | "required";

export default function ApplicationFormSettings({
  config,
}: {
  config: ApplicationConfig;
}) {
  const [work, setWork] = useState<Mode>(config.work_experience);
  const [refs, setRefs] = useState<Mode>(config.references);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save(next: { work_experience: Mode; references: Mode }) {
    setSaved(false);
    startTransition(async () => {
      await saveApplicationConfig(next);
      setSaved(true);
    });
  }

  return (
    <div className="card mt-6 max-w-xl">
      <h2 className="font-extrabold text-lg">Application form</h2>
      <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
        Choose which optional sections candidates see.
      </p>
      <div className="mt-4 space-y-3">
        <FieldRow
          label="Work experience"
          value={work}
          onChange={(v) => {
            setWork(v);
            save({ work_experience: v, references: refs });
          }}
        />
        <FieldRow
          label="References"
          value={refs}
          onChange={(v) => {
            setRefs(v);
            save({ work_experience: work, references: v });
          }}
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

function FieldRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Mode;
  onChange: (v: Mode) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-semibold">{label}</span>
      <div className="flex rounded-xl border border-[color:var(--brand-line)] overflow-hidden">
        {(["hidden", "optional", "required"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={[
              "px-3 py-1.5 text-sm font-semibold capitalize transition",
              value === m
                ? "bg-[color:var(--brand-pink)] text-white"
                : "bg-white text-[color:var(--brand-ink)] hover:bg-[color:var(--brand-pink-50)]",
            ].join(" ")}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
