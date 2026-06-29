"use client";

import { useState } from "react";
import { saveNotifyPrefs } from "@/app/admin/notifications/actions";
import {
  DEFAULT_EMAIL,
  DEFAULT_SMS,
  type NotifyPrefs,
  type NotifyEvent,
} from "@/lib/notify-prefs";

const EVENTS: { key: NotifyEvent; title: string; blurb: string }[] = [
  {
    key: "new_application",
    title: "New application",
    blurb: "The moment someone applies — before they're screened. (Noisy.)",
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

type Flags = Record<NotifyEvent, boolean>;

export default function NotificationPrefs({
  initialPrefs,
  initialPhone,
}: {
  initialPrefs: NotifyPrefs;
  initialPhone: string;
}) {
  const [email, setEmail] = useState<Flags>(() => ({
    new_application: initialPrefs.new_application?.email ?? DEFAULT_EMAIL.new_application,
    assessment_done: initialPrefs.assessment_done?.email ?? DEFAULT_EMAIL.assessment_done,
    strong: initialPrefs.strong?.email ?? DEFAULT_EMAIL.strong,
  }));
  const [sms, setSms] = useState<Flags>(() => ({
    new_application: initialPrefs.new_application?.sms ?? DEFAULT_SMS.new_application,
    assessment_done: initialPrefs.assessment_done?.sms ?? DEFAULT_SMS.assessment_done,
    strong: initialPrefs.strong?.sms ?? DEFAULT_SMS.strong,
  }));
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasPhone = phone.trim().length > 0;

  async function save() {
    setSaving(true);
    setSaved(false);
    const prefs: NotifyPrefs = {
      new_application: { email: email.new_application, sms: sms.new_application },
      assessment_done: { email: email.assessment_done, sms: sms.assessment_done },
      strong: { email: email.strong, sms: sms.strong },
    };
    const res = await saveNotifyPrefs(prefs, phone);
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  function Box({
    channel,
    eventKey,
    disabled,
  }: {
    channel: "email" | "sms";
    eventKey: NotifyEvent;
    disabled?: boolean;
  }) {
    const map = channel === "email" ? email : sms;
    const setter = channel === "email" ? setEmail : setSms;
    return (
      <input
        type="checkbox"
        checked={map[eventKey]}
        disabled={disabled}
        onChange={(ev) => {
          setSaved(false);
          setter((m) => ({ ...m, [eventKey]: ev.target.checked }));
        }}
        className="h-5 w-5 accent-[color:var(--brand-pink)] disabled:opacity-40"
      />
    );
  }

  return (
    <div className="card max-w-2xl">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_4rem_4rem] items-end gap-2 pb-2 border-b border-[color:var(--brand-line)]">
        <span className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
          Notify me about
        </span>
        <span className="text-xs font-semibold text-center">Email</span>
        <span className="text-xs font-semibold text-center">Text</span>
      </div>

      <div className="divide-y divide-[color:var(--brand-line)]">
        {EVENTS.map((e) => (
          <div key={e.key} className="grid grid-cols-[1fr_4rem_4rem] items-center gap-2 py-3">
            <span>
              <span className="font-bold">{e.title}</span>
              <span className="block text-sm text-[color:var(--brand-ink-muted)]">{e.blurb}</span>
            </span>
            <span className="flex justify-center">
              <Box channel="email" eventKey={e.key} />
            </span>
            <span className="flex justify-center">
              <Box channel="sms" eventKey={e.key} disabled={!hasPhone} />
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-5 border-t border-[color:var(--brand-line)]">
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
          {hasPhone
            ? "Text alerts go to this number. (Texting goes live once carrier registration is approved — your choices are saved and ready.)"
            : "Add a number to turn on the Text checkboxes."}
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
