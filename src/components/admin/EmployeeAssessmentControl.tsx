"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendEmployeeAssessment } from "@/app/admin/employees/actions";
import type { AssessStatus } from "@/lib/employee-assessment";

export default function EmployeeAssessmentControl({
  employeeId,
  status,
  applicationId,
}: {
  employeeId: string;
  status: AssessStatus;
  applicationId: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function send() {
    setError(null);
    setFlash(null);
    const fd = new FormData();
    fd.set("employee_id", employeeId);
    start(async () => {
      const res = await sendEmployeeAssessment(fd);
      if (res.ok) {
        setFlash("Assessment sent.");
        router.refresh();
      } else setError(res.error);
    });
  }

  return (
    <div className="card mt-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-extrabold text-lg">Assessment</h2>
          <p className="text-sm text-[color:var(--brand-ink-muted)] mt-0.5">
            {status === "assessed"
              ? "Completed — their scores feed the fit-vs-performance analytics."
              : status === "sent"
                ? "Sent — waiting for them to complete it."
                : "Send the assessment to benchmark them alongside the rest of your team."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              "chip " +
              (status === "assessed"
                ? "bg-emerald-100 text-emerald-800"
                : status === "sent"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-200 text-gray-600")
            }
          >
            {status === "assessed" ? "Assessed" : status === "sent" ? "Sent" : "Not assessed"}
          </span>
          {status === "none" && applicationId && (
            <button className="btn-primary" onClick={send} disabled={pending}>
              {pending ? "Sending…" : "Send assessment"}
            </button>
          )}
        </div>
      </div>
      {flash && <div className="text-sm text-emerald-700 mt-2">{flash}</div>}
      {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
    </div>
  );
}
