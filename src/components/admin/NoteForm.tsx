"use client";

import { useRef, useTransition } from "react";
import { addNote } from "@/app/admin/applicants/[id]/actions";

export default function NoteForm({ applicantId }: { applicantId: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-3 space-y-2"
      action={() => {
        const body = ref.current?.value ?? "";
        if (!body.trim()) return;
        startTransition(async () => {
          await addNote(applicantId, body);
          if (ref.current) ref.current.value = "";
        });
      }}
    >
      <textarea
        ref={ref}
        className="input min-h-[80px] text-sm"
        placeholder="Add a note (visible only to managers)…"
      />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Add note"}
      </button>
    </form>
  );
}
