"use client";

import { useState, useTransition } from "react";
import { sendAssessmentToCandidate } from "@/app/admin/candidates/actions";

export default function SendAssessmentButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await sendAssessmentToCandidate(id);
            if (!res.ok) setError(res.error ?? "Could not send.");
          });
        }}
        className="btn-primary"
      >
        {pending ? "Sending…" : "Send assessment"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
