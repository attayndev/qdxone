"use client";

import { useTransition } from "react";
import { updateHiringStatus } from "@/app/admin/applicants/[id]/actions";
import type { HiringStatus } from "@/lib/supabase/types";

const OPTIONS: Array<{ value: HiringStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "interview_requested", label: "Interview Requested" },
  { value: "interviewed", label: "Interviewed" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

export default function HiringStatusSelect({
  applicantId,
  value,
}: {
  applicantId: string;
  value: HiringStatus;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      className="input"
      defaultValue={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as HiringStatus;
        startTransition(async () => {
          await updateHiringStatus(applicantId, next);
        });
      }}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
