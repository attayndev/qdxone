"use client";

import { useState, useTransition } from "react";
import { deleteLocation } from "@/app/admin/locations/actions";

export default function DeleteLocationButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!confirm(`Delete ${name}? This can't be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteLocation(id);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete store"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </span>
  );
}
