"use client";

import { useState, useTransition } from "react";
import {
  RACE_OPTIONS,
  GENDER_OPTIONS,
  VETERAN_OPTIONS,
  DISABILITY_OPTIONS,
  type EeoOption,
} from "@/lib/eeo";
import type { EeoPayload } from "@/app/eeo/[token]/actions";

export default function EeoForm({
  token,
  orgName,
  submitAction,
}: {
  token: string;
  orgName: string;
  submitAction: (token: string, payload: EeoPayload) => Promise<{ ok: boolean }>;
}) {
  const [race, setRace] = useState("");
  const [gender, setGender] = useState("");
  const [veteran, setVeteran] = useState("");
  const [disability, setDisability] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function finish(payload: EeoPayload) {
    startTransition(async () => {
      await submitAction(token, payload);
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto card text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-3 text-3xl font-black tracking-tight">All set.</h1>
        <p className="mt-3 text-[color:var(--brand-ink-muted)]">
          Thanks for applying to {orgName}. You&apos;re all done — you can close
          this tab. The team will be in touch.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
        One last, optional step
      </h1>
      <div className="card mt-4 bg-[color:var(--brand-cream)]">
        <p className="text-[15px] leading-relaxed">
          This information is requested for{" "}
          <strong>voluntary self-identification</strong> only. Answering is
          completely your choice, and your responses{" "}
          <strong>will not affect your application or any hiring decision</strong>.
          It&apos;s kept <strong>separate from your application</strong> and used
          only for anonymous reporting that helps {orgName} ensure fair hiring.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <Question
          label="Race / ethnicity"
          options={RACE_OPTIONS}
          value={race}
          onChange={setRace}
          name="race"
        />
        <Question
          label="Gender"
          options={GENDER_OPTIONS}
          value={gender}
          onChange={setGender}
          name="gender"
        />
        <Question
          label="Protected veteran status"
          options={VETERAN_OPTIONS}
          value={veteran}
          onChange={setVeteran}
          name="veteran"
        />
        <Question
          label="Disability status"
          options={DISABILITY_OPTIONS}
          value={disability}
          onChange={setDisability}
          name="disability"
        />
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            finish({
              declined: false,
              race_ethnicity: race || null,
              gender: gender || null,
              veteran_status: veteran || null,
              disability_status: disability || null,
            })
          }
          className="btn-primary"
        >
          {pending ? "Submitting…" : "Submit"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => finish({ declined: true })}
          className="btn-ghost"
        >
          Skip — I&apos;d rather not
        </button>
      </div>
    </div>
  );
}

function Question({
  label,
  options,
  value,
  onChange,
  name,
}: {
  label: string;
  options: EeoOption[];
  value: string;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <fieldset>
      <legend className="font-bold">{label}</legend>
      <div className="mt-2 space-y-1.5">
        {options.map((o) => (
          <label
            key={o.value}
            className={[
              "flex items-center gap-3 rounded-xl px-3 py-2 border cursor-pointer transition",
              value === o.value
                ? "border-[color:var(--brand-pink)] bg-[color:var(--brand-pink-50)]"
                : "border-[color:var(--brand-line)] bg-white hover:border-[color:var(--brand-pink)]/60",
            ].join(" ")}
          >
            <input
              type="radio"
              name={name}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span className="text-[15px] leading-snug">{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
