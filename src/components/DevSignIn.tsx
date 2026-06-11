"use client";

import { useState, useTransition } from "react";
import { devSignIn } from "@/app/login/actions";

/**
 * DEV ONLY sign-in (no email). Rendered only when NODE_ENV !== production.
 * The action returns a URL and we navigate with a full reload, which carries
 * the freshly-set session cookie across subdomains.
 */
export default function DevSignIn({
  defaultSlug = "16handlesnewcity",
}: {
  defaultSlug?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await devSignIn(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.href = res.redirectTo;
    });
  }

  return (
    <form
      action={onSubmit}
      className="mt-6 border-t border-dashed border-[color:var(--brand-line)] pt-4"
    >
      <p className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
        Dev only · skip email
      </p>
      <div className="mt-2 space-y-2">
        <input
          className="input"
          name="email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          placeholder="you@example.com"
          required
        />
        <div className="flex gap-2">
          <input
            className="input flex-1"
            name="slug"
            defaultValue={defaultSlug}
            placeholder="org slug"
          />
          <button
            type="submit"
            disabled={pending}
            className="btn-ghost whitespace-nowrap"
          >
            {pending ? "…" : "Dev sign-in"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
