"use client";

import { useTransition } from "react";
import { removeMember } from "./actions";

export default function RemoveMemberButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`Remove ${email} from your team?`)) return;
    startTransition(async () => {
      await removeMember(userId);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
