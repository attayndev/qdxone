"use client";

import { useState } from "react";
import { saveNotifyPrefs } from "@/app/admin/notifications/actions";
import { DEFAULT_EMAIL, type NotifyPrefs, type NotifyEvent } from "@/lib/notify-prefs";

const EVENTS: { key: NotifyEvent; title: string; blurb: string }[] = [
  {
    key: "new_application",
    title: "New application",
    blurb: "The moment someone applies — before they're screened. (Noisy; off by default.)",
  },
  {
    key: "assessment_done",
    title: "Assessment finished",
    blurb: "When a candidate completes the assessment, with their fit score.",
  },
  {
    key: "strong",
    title: "⭐ Strong candidates",
    blurb: "Just the standouts — a strong-fit result.",
  },
];

export default function NotificationPrefs({
  initialPrefs,
  initialPhone,
}: {
  initialPrefs: NotifyPrefs;
  initialPhone: string;
}) {
  const [email, setEmail] = useState<Record<NotifyEvent, boolean>>(() => ({
    new_application: initialPrefs.new_application?.email ?? DEFAULT_EMAIL.new_application,
    assessment_done: initialPrefs.assessment_done?.email ?? DEFAULT_EMAIL.assessment_done,
    strong: initialPrefs.strong?.email ?? DEFAULT_EMAIL.strong,
  }));
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const prefs: NotifyPrefs = {
      new_application: { email: email.new_application },
      assessment_done: { email: email.assessment_done },
      strong: { email: email.strong },
    };
    const res = await saveNotifyPrefs(prefs, phone);
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div className="card max-w-2xl">
      <div className="space-y-4">
        {EVENTS.map((e) => (
          <label key={e.key} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={email[e.key]}
              onChange={(ev) => {
                setSaved(false);
                setEmail((m) => ({ ...m, [e.key]: ev.target.checked }));
              }}
              className="mt-1 h-5 w-5 accent-[color:var(--brand-pink)]"
            />
            <span>
              <span className="font-bold">{e.title}</span>
              <span className="block text-sm text-[color:var(--brand-ink-muted)]">{e.blurb}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-[color:var(--brand-line)]">
        <label className="block">
          <span className="label">Mobile number (for text alerts)</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setSaved(false);
              setPhone(e.target.value);
            }}
            placeholder="+1 555 123 4567"
            className="input max-w-xs"
          />
        </label>
        <p className="mt-1 text-xs text-[color:var(--brand-ink-muted)]">
          Texts aren&apos;t live yet — we&apos;ll use this number once SMS alerts
          are enabled. Email is on now.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button type="button" onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save preferences"}
        </button>
        {saved && <span className="text-sm text-green-700 font-medium">Saved.</span>}
      </div>
    </div>
  );
}
