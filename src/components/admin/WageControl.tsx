"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setEmployeeWage } from "@/app/admin/employees/actions";

export default function WageControl({
  employeeId,
  wage,
}: {
  employeeId: string;
  wage: number | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(wage != null ? String(wage) : "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    setSaved(false);
    const fd = new FormData();
    fd.set("employee_id", employeeId);
    fd.set("hourly_wage", value);
    start(async () => {
      const res = await setEmployeeWage(fd);
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="card mt-5">
      <h2 className="font-extrabold text-lg">Hourly wage</h2>
      <p className="text-sm text-[color:var(--brand-ink-muted)] mt-0.5">
        Used to project labor cost on the schedule. Only you see this — never the employee.
      </p>
      <div className="flex items-end gap-2 mt-3 flex-wrap">
        <div>
          <label className="label">$ / hour</label>
          <div className="flex items-center gap-1">
            <span className="text-[color:var(--brand-ink-muted)]">$</span>
            <input
              className="input w-32"
              type="number"
              min="0"
              step="0.25"
              inputMode="decimal"
              value={value}
              onChange={(e) => { setValue(e.target.value); setSaved(false); }}
              placeholder="e.g. 16.50"
            />
          </div>
        </div>
        <button className="btn-primary" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-sm text-emerald-700 pb-2">Saved.</span>}
      </div>
      {error && <div className="text-sm text-rose-600 mt-1">{error}</div>}
    </div>
  );
}
