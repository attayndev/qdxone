"use client";

import { useState, useTransition } from "react";
import { saveLocation } from "@/app/admin/locations/actions";
import type { LocationRow } from "@/lib/locations";

export default function LocationForm({
  location,
}: {
  location: LocationRow | null;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<
    { kind: "ok" } | { kind: "err"; message: string } | null
  >(null);

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await saveLocation(formData);
      setResult(res.ok ? { kind: "ok" } : { kind: "err", message: res.error });
    });
  }

  return (
    <form action={onSubmit} className="card mt-6 space-y-3 max-w-2xl">
      <div>
        <label className="label">Store name</label>
        <input
          className="input"
          name="name"
          defaultValue={location?.name ?? ""}
          placeholder="e.g. 16 Handles New City"
          required
        />
      </div>
      <div>
        <label className="label">Address</label>
        <input
          className="input"
          name="address_line1"
          defaultValue={location?.address_line1 ?? ""}
          placeholder="Street address"
        />
        <input
          className="input mt-2"
          name="address_line2"
          defaultValue={location?.address_line2 ?? ""}
          placeholder="Suite / unit (optional)"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">City</label>
          <input className="input" name="city" defaultValue={location?.city ?? ""} />
        </div>
        <div>
          <label className="label">State</label>
          <input className="input" name="region" defaultValue={location?.region ?? ""} />
        </div>
        <div>
          <label className="label">ZIP</label>
          <input
            className="input"
            name="postal_code"
            defaultValue={location?.postal_code ?? ""}
          />
        </div>
      </div>
      <div>
        <label className="label">Time zone</label>
        <input
          className="input"
          name="timezone"
          defaultValue={location?.timezone ?? "America/New_York"}
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : location ? "Save changes" : "Create store profile"}
        </button>
        {result?.kind === "ok" && (
          <span className="text-sm text-emerald-700">Saved.</span>
        )}
        {result?.kind === "err" && (
          <span className="text-sm text-red-600">{result.message}</span>
        )}
      </div>
    </form>
  );
}
