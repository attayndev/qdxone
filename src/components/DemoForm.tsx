"use client";

import { useState, useTransition } from "react";
import { submitDemoRequest, type DemoResult } from "@/app/demo/actions";

export default function DemoForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<DemoResult | null>(null);

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      setResult(await submitDemoRequest(formData));
    });
  }

  if (result?.ok) {
    return (
      <div>
        <h2 className="font-extrabold text-xl">Got it.</h2>
        <p className="mt-2 text-[color:var(--brand-ink-muted)]">
          Yan will be in touch within one business day to schedule a quick
          15-minute walkthrough.
        </p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div>
        <label className="label">Your name</label>
        <input name="name" className="input" required />
      </div>
      <div>
        <label className="label">Email</label>
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          className="input"
          required
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Concept</label>
          <input
            name="concept"
            className="input"
            placeholder="e.g. ice cream, coffee, sub shop"
          />
        </div>
        <div>
          <label className="label">Locations</label>
          <input
            name="units"
            className="input"
            placeholder="1, 2-5, 6+"
          />
        </div>
      </div>
      <div>
        <label className="label">Anything to add (optional)</label>
        <textarea
          name="note"
          className="input min-h-[100px]"
          placeholder="What's the hiring problem you're trying to solve?"
        />
      </div>
      {result && !result.ok && (
        <p className="text-sm text-red-600">{result.error}</p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Sending…" : "Request demo"}
      </button>
    </form>
  );
}
