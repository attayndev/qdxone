"use client";

import { useState, useTransition } from "react";
import { updateBranding } from "@/app/admin/settings/actions";
import type { OrganizationRow } from "@/lib/supabase/types";

export default function SettingsForm({ org }: { org: OrganizationRow }) {
  const b = org.branding;
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );

  function onSubmit(formData: FormData) {
    setMsg(null);
    startTransition(async () => {
      const r = await updateBranding(formData);
      setMsg(
        r.ok
          ? { kind: "ok", text: "Saved." }
          : { kind: "err", text: r.error }
      );
    });
  }

  return (
    <form action={onSubmit} className="card mt-6 space-y-4 max-w-2xl">
      <div>
        <label className="label">Business name</label>
        <input name="name" className="input" defaultValue={org.name} required />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Display name (short)</label>
          <input
            name="display_name"
            className="input"
            placeholder="e.g. 16 Handles"
            defaultValue={b.display_name ?? ""}
          />
        </div>
        <div>
          <label className="label">Location subtitle</label>
          <input
            name="location_subtitle"
            className="input"
            placeholder="e.g. New City"
            defaultValue={b.location_subtitle ?? ""}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Industry tag</label>
          <input
            name="industry"
            className="input"
            placeholder="froyo, retail, food, ..."
            defaultValue={b.industry ?? ""}
          />
        </div>
        <div>
          <label className="label">Primary color (hex)</label>
          <input
            name="primary_color"
            className="input"
            placeholder="#ff2d87"
            defaultValue={b.primary_color ?? ""}
          />
        </div>
      </div>

      <div>
        <label className="label">Hero eyebrow</label>
        <input
          name="hero_copy_eyebrow"
          className="input"
          placeholder="Now hiring · New City, NY"
          defaultValue={b.hero_copy_eyebrow ?? ""}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Headline (start)</label>
          <input
            name="hero_copy_h1_pre"
            className="input"
            placeholder="Scoop joy."
            defaultValue={b.hero_copy_h1_pre ?? ""}
          />
        </div>
        <div>
          <label className="label">Headline (accent)</label>
          <input
            name="hero_copy_h1_post"
            className="input"
            placeholder="Earn it."
            defaultValue={b.hero_copy_h1_post ?? ""}
          />
        </div>
      </div>

      <p className="text-xs text-[color:var(--brand-ink-muted)] border-t border-[color:var(--brand-line)] pt-4">
        Have a specific policy candidates should acknowledge (e.g. phones off
        the floor)? Add it as a <strong>custom question</strong> in Store setup.
      </p>

      {msg && (
        <p
          className={
            msg.kind === "ok"
              ? "text-sm text-emerald-600"
              : "text-sm text-red-600"
          }
        >
          {msg.text}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
