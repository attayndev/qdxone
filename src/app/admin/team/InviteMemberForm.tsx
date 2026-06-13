"use client";

import { useState, useTransition } from "react";
import { inviteMember, type TeamResult } from "./actions";

export default function InviteMemberForm({ disabled }: { disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<TeamResult | null>(null);

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const r = await inviteMember(formData);
      setResult(r);
    });
  }

  if (disabled) {
    return (
      <p className="text-sm text-[color:var(--brand-ink-muted)]">
        You&apos;ve used all your seats. Add a location or upgrade to invite more
        managers.
      </p>
    );
  }

  return (
    <form action={onSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        name="email"
        type="email"
        inputMode="email"
        autoCapitalize="none"
        placeholder="manager@email.com"
        required
        className="input flex-1"
      />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Adding…" : "Add manager"}
      </button>
      {result && !result.ok && (
        <p className="w-full text-sm text-red-600">{result.error}</p>
      )}
      {result?.ok && (
        <p className="w-full text-sm text-emerald-700">
          Added — they can sign in with that email.
        </p>
      )}
    </form>
  );
}
