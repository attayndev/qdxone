"use client";

import { useState } from "react";

export default function SetStaffPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setPending(true);
    const res = await fetch("/api/staff-auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "set-password", password }),
    });
    const body = await res.json().catch(() => ({}) as { error?: string });
    if (res.ok) {
      window.location.href = "/staff";
      return;
    }
    setError(body?.error || "Could not set password.");
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">New password</label>
        <input className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div>
        <label className="label">Confirm password</label>
        <input className="input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Saving…" : "Set password & continue"}
      </button>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </form>
  );
}
