"use client";

import { useState, useTransition } from "react";
import { signup, type SignupResult } from "@/app/signup/actions";

export default function SignupForm({ rootDomain }: { rootDomain: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SignupResult | null>(null);
  const [slug, setSlug] = useState("");

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const r = await signup(formData);
      setResult(r);
    });
  }

  if (result?.ok) {
    return (
      <div>
        <h2 className="font-extrabold text-xl">You&apos;re almost in</h2>
        {result.checkoutUrl ? (
          <>
            <p className="mt-2 text-[color:var(--brand-ink-muted)]">
              Add a card to start your <strong>30-day free trial</strong>.
              You won&apos;t be charged until it ends, and you can cancel
              anytime.
            </p>
            <a href={result.checkoutUrl} className="btn-primary mt-4 inline-block">
              Add card &amp; start trial
            </a>
          </>
        ) : (
          <p className="mt-2 text-[color:var(--brand-ink-muted)]">
            Your workspace is created. Your 30-day trial has started.
          </p>
        )}
        <p className="mt-4 text-sm text-[color:var(--brand-ink-muted)]">
          {result.magicLinkSent
            ? "We also emailed you a sign-in link — click it to reach your dashboard."
            : "Sign in here when you're ready:"}
        </p>
        {!result.magicLinkSent && (
          <p className="mt-1 text-sm font-mono break-all">{result.orgUrl}</p>
        )}
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div>
        <label className="label">Business name</label>
        <input
          name="name"
          className="input"
          placeholder="e.g. 16 Handles New City"
          required
        />
      </div>
      <div>
        <label className="label">Your email</label>
        <input
          name="email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="email"
          className="input"
          required
        />
      </div>
      <div>
        <label className="label">Pick a subdomain</label>
        <div className="flex items-stretch rounded-xl border border-[color:var(--brand-line)] bg-white overflow-hidden">
          <input
            name="slug"
            value={slug}
            onChange={(e) =>
              setSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "")
                  .slice(0, 30)
              )
            }
            className="flex-1 px-3 py-2 outline-none"
            placeholder="yourshop"
            required
            minLength={2}
            maxLength={30}
            pattern="^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$"
          />
          <span className="px-3 py-2 bg-[color:var(--brand-cream)] text-sm text-[color:var(--brand-ink-muted)] flex items-center">
            .{rootDomain}
          </span>
        </div>
      </div>

      <fieldset>
        <legend className="label">Plan — 30-day free trial on all</legend>
        <div className="grid grid-cols-3 gap-2">
          <RadioCard name="plan" value="starter" defaultChecked label="Starter" sub="25 assessments/mo" />
          <RadioCard name="plan" value="growth" label="Growth" sub="100 assessments/mo" />
          <RadioCard name="plan" value="pro" label="Pro" sub="Unlimited" />
        </div>
        <p className="mt-2 text-xs text-[color:var(--brand-ink-muted)]">
          Monthly, per location. Card captured now, first charge after your
          30-day trial. Bigger or multi-brand? <span className="font-semibold">Enterprise</span> is custom — talk to us.
        </p>
      </fieldset>

      {result && !result.ok && (
        <p className="text-sm text-red-600">{result.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Creating…" : "Create my workspace"}
      </button>
    </form>
  );
}

function RadioCard({
  name,
  value,
  label,
  sub,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  sub: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="block cursor-pointer rounded-xl border border-[color:var(--brand-line)] bg-white p-3 has-checked:border-[color:var(--brand-pink)] has-checked:bg-[color:var(--brand-pink-50)]">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      <div className="font-bold">{label}</div>
      <div className="text-xs text-[color:var(--brand-ink-muted)] mt-0.5">
        {sub}
      </div>
    </label>
  );
}
