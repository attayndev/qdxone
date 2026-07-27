"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteEmployeeToStaff, revokeStaffAccess } from "@/app/admin/employees/actions";

export default function StaffAccessControl({
  employeeId,
  email,
  invitedAt,
  activatedAt,
}: {
  employeeId: string;
  email: string | null;
  invitedAt: string | null;
  activatedAt: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const status = activatedAt ? "active" : invitedAt ? "invited" : "none";

  function run(fd: FormData, fn: (fd: FormData) => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    setError(null);
    setFlash(null);
    start(async () => {
      const res = await fn(fd);
      if (res.ok) {
        setFlash(okMsg);
        router.refresh();
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  function invite() {
    const fd = new FormData();
    fd.set("employee_id", employeeId);
    run(fd, inviteEmployeeToStaff, status === "none" ? "Invite sent." : "New link sent.");
  }
  function revoke() {
    const fd = new FormData();
    fd.set("employee_id", employeeId);
    run(fd, revokeStaffAccess, "Access revoked.");
  }

  return (
    <div className="card mt-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-extrabold text-lg">Schedule portal access</h2>
          <p className="text-sm text-[color:var(--brand-ink-muted)] mt-0.5">
            {status === "active"
              ? `Active — signs in with ${email}.`
              : status === "invited"
                ? `Invited ${invitedAt ? new Date(invitedAt).toLocaleDateString() : ""} — waiting for them to set a password.`
                : email
                  ? `Not invited yet. Invite them to see their schedule at ${email}.`
                  : "No email on file — add one to invite them."}
          </p>
        </div>
        <span
          className={
            "chip " +
            (status === "active"
              ? "bg-emerald-100 text-emerald-800"
              : status === "invited"
                ? "bg-amber-100 text-amber-800"
                : "bg-gray-200 text-gray-600")
          }
        >
          {status === "active" ? "Active" : status === "invited" ? "Invited" : "No access"}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button className="btn-primary" onClick={invite} disabled={pending || !email}>
          {pending ? "Working…" : status === "none" ? "Invite to portal" : "Resend link"}
        </button>
        {status !== "none" && (
          <button className="btn-ghost text-rose-600" onClick={revoke} disabled={pending}>
            Revoke access
          </button>
        )}
      </div>
      {flash && <div className="text-sm text-emerald-700 mt-2">{flash}</div>}
      {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
    </div>
  );
}
