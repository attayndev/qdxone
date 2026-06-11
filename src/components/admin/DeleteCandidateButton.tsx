"use client";

import { useTransition } from "react";
import { deleteApplication } from "@/app/admin/candidates/actions";

export default function DeleteCandidateButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          window.confirm(
            `Delete ${name}'s application? This permanently removes their assessment too and can't be undone.`
          )
        ) {
          startTransition(() => deleteApplication(id));
        }
      }}
      className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete application"}
    </button>
  );
}
