"use client";

import { useState, useTransition } from "react";
import { createPosting, setPostingStatus } from "@/app/admin/postings/actions";

export type PostingView = {
  id: string;
  title: string;
  role_type: "crew" | "shift_lead" | "gm";
  status: "draft" | "open" | "closed";
  url: string;
  qrSvg: string;
};

const ROLE_LABELS: Record<PostingView["role_type"], string> = {
  crew: "Crew",
  shift_lead: "Shift Lead",
  gm: "General Manager",
};

export default function PostingsClient({
  postings,
  hasLocation,
}: {
  postings: PostingView[];
  hasLocation: boolean;
}) {
  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-6 mt-6">
      <CreateForm hasLocation={hasLocation} />
      <div className="card">
        <h2 className="font-extrabold text-lg">Your postings</h2>
        <ul className="mt-3 space-y-4">
          {postings.length === 0 && (
            <li className="text-sm text-[color:var(--brand-ink-muted)]">
              No postings yet. Create one to get a shareable link and QR code.
            </li>
          )}
          {postings.map((p) => (
            <PostingItem key={p.id} posting={p} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function CreateForm({ hasLocation }: { hasLocation: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createPosting(formData);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="card">
      <h2 className="font-extrabold text-lg">New posting</h2>
      <p className="text-[color:var(--brand-ink-muted)] text-sm mt-1">
        Creates a shareable link + QR code for in-store flyers.
      </p>
      {!hasLocation && (
        <p className="mt-3 text-sm text-[color:var(--brand-pink-600)]">
          Set up your store profile first, then come back to post.
        </p>
      )}
      <form action={onSubmit} className="mt-4 space-y-3">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            name="title"
            placeholder="e.g. Crew Member — Weekends"
            required
          />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" name="role_type" defaultValue="crew">
            <option value="crew">Crew</option>
            <option value="shift_lead">Shift Lead</option>
            <option value="gm">General Manager</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={pending || !hasLocation}
          className="btn-primary w-full disabled:opacity-40"
        >
          {pending ? "Creating…" : "Create posting"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function PostingItem({ posting }: { posting: PostingView }) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  return (
    <li className="rounded-xl border border-[color:var(--brand-line)] p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold">{posting.title}</div>
          <div className="text-xs text-[color:var(--brand-ink-muted)] mt-0.5 flex gap-2">
            <span>{ROLE_LABELS[posting.role_type]}</span>
            <span>·</span>
            <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)]">
              {posting.status}
            </span>
          </div>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setPostingStatus(
                posting.id,
                posting.status === "open" ? "closed" : "open"
              );
            })
          }
          className="text-sm font-semibold text-[color:var(--brand-pink-600)] hover:underline"
        >
          {posting.status === "open" ? "Close" : "Reopen"}
        </button>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row gap-4 items-start">
        <div
          className="shrink-0 rounded-lg bg-white p-2 border border-[color:var(--brand-line)] [&>svg]:w-28 [&>svg]:h-28"
          dangerouslySetInnerHTML={{ __html: posting.qrSvg }}
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
            Public link
          </div>
          <div className="font-mono text-xs break-all mt-1">{posting.url}</div>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(posting.url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  window.open(posting.url, "_blank");
                }
              }}
              className="text-sm font-semibold text-[color:var(--brand-pink-600)] hover:underline"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <a
              href={posting.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-[color:var(--brand-pink-600)] hover:underline"
            >
              Open
            </a>
          </div>
        </div>
      </div>
    </li>
  );
}
