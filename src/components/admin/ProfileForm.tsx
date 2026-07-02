"use client";

import { useState, useTransition } from "react";
import { saveProfile } from "@/app/admin/notifications/actions";

/** Your name — stored on your user, shown wherever you appear (scheduling, team). */
export default function ProfileForm({
  initialFirst,
  initialLast,
  email,
}: {
  initialFirst: string;
  initialLast: string;
  email: string;
}) {
  const [first, setFirst] = useState(initialFirst);
  const [last, setLast] = useState(initialLast);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    start(async () => {
      await saveProfile(first, last);
      setSaved(true);
    });
  }

  return (
    <div className="card max-w-xl">
      <h2 className="font-extrabold text-lg">Your profile</h2>
      <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
        Your name shows up on interviews you schedule and across your team. Signed in
        as <strong>{email}</strong>.
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <label className="block">
          <span className="label">First name</span>
          <input className="input" value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Jane" />
        </label>
        <label className="block">
          <span className="label">Last name</span>
          <input className="input" value={last} onChange={(e) => setLast(e.target.value)} placeholder="Doe" />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="btn-primary">
          {pending ? "Saving…" : "Save name"}
        </button>
        {saved && <span className="text-sm text-emerald-700">Saved.</span>}
      </div>
    </div>
  );
}
