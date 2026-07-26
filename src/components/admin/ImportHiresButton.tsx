"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importExistingHires } from "@/app/admin/employees/actions";

/** One-tap import of hired candidates that predate employee tracking. */
export default function ImportHiresButton({ count }: { count: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    start(async () => {
      const res = await importExistingHires();
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="btn-primary whitespace-nowrap"
      >
        {pending ? "Importing…" : `Import ${count} past hire${count === 1 ? "" : "s"}`}
      </button>
      {error && <div className="text-sm text-rose-600 mt-1">{error}</div>}
    </div>
  );
}
