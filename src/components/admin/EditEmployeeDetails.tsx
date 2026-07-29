"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateEmployeeDetails } from "@/app/admin/employees/actions";

/** Inline "Edit details" for an employee's name + email (e.g. fix an import typo). */
export default function EditEmployeeDetails({
  employeeId,
  firstName,
  lastName,
  email,
}: {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [mail, setMail] = useState(email ?? "");
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFirst(firstName);
    setLast(lastName);
    setMail(email ?? "");
    setError(null);
    setOpen(false);
  }

  function save() {
    setError(null);
    const fd = new FormData();
    fd.set("employee_id", employeeId);
    fd.set("first_name", first);
    fd.set("last_name", last);
    fd.set("email", mail);
    start(async () => {
      const res = await updateEmployeeDetails(fd);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else setError(res.error);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        className="mt-2 text-sm font-semibold text-[color:var(--brand-blue-600)] hover:underline"
        onClick={() => setOpen(true)}
      >
        Edit details
      </button>
    );
  }

  return (
    <div className="card mt-3 max-w-lg">
      <h2 className="font-extrabold">Edit details</h2>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <div>
          <label className="label">First name</label>
          <input className="input" value={first} onChange={(e) => setFirst(e.target.value)} />
        </div>
        <div>
          <label className="label">Last name</label>
          <input className="input" value={last} onChange={(e) => setLast(e.target.value)} />
        </div>
      </div>
      <div className="mt-3">
        <label className="label">Email</label>
        <input className="input" type="email" value={mail} onChange={(e) => setMail(e.target.value)} />
      </div>
      {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
      <div className="flex items-center gap-2 mt-3">
        <button className="btn-primary" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        <button className="btn-ghost" onClick={reset} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}
