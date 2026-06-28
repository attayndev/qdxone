"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createInterviewInvite } from "@/app/admin/scheduling/actions";

interface TypeOption {
  id: string;
  name: string;
  durationMinutes: number;
}

export default function InviteToInterview({
  applicationId,
  types,
}: {
  applicationId: string;
  types: TypeOption[];
}) {
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (types.length === 0) {
    return (
      <div className="card">
        <div className="font-semibold">Invite to interview</div>
        <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
          First, create an interview type on your{" "}
          <Link href="/admin/scheduling" className="underline">
            Calendar page
          </Link>
          .
        </p>
      </div>
    );
  }

  function generate() {
    setErr(null);
    setCopied(false);
    start(async () => {
      const r = await createInterviewInvite(applicationId, typeId);
      if (r.ok) setUrl(r.url);
      else setErr(r.error);
    });
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="card">
      <div className="font-semibold">Invite to interview</div>
      <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1 mb-3">
        Generate a link the candidate can use to book a time from your open slots.
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-48">
          <label className="label">Interview type</label>
          <select className="input" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.durationMinutes} min)
              </option>
            ))}
          </select>
        </div>
        <button onClick={generate} disabled={pending} className="btn-primary">
          {pending ? "Creating…" : url ? "New link" : "Create booking link"}
        </button>
      </div>

      {err && <p className="text-red-700 text-sm mt-2">{err}</p>}

      {url && (
        <div className="mt-3">
          <label className="label">Booking link</label>
          <div className="flex gap-2">
            <input readOnly value={url} className="input flex-1" onFocus={(e) => e.target.select()} />
            <button
              onClick={copy}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm font-medium hover:bg-black/5 shrink-0"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-[color:var(--brand-ink-muted)] mt-1">
            Share it by text or email. It expires in 14 days and works once.
          </p>
        </div>
      )}
    </div>
  );
}
