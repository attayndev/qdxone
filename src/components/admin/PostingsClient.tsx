"use client";

import { useState, useTransition } from "react";
import {
  createPosting,
  setPostingStatus,
  updatePosting,
  deletePosting,
} from "@/app/admin/postings/actions";

export type PostingView = {
  id: string;
  title: string;
  status: "draft" | "open" | "closed";
  url: string;
  qrSvg: string;
  locationId?: string | null;
  location?: string | null;
};

type StoreOption = { id: string; name: string };

export default function PostingsClient({
  postings,
  hasLocation,
  roles,
  locations,
}: {
  postings: PostingView[];
  hasLocation: boolean;
  roles: string[];
  locations: StoreOption[];
}) {
  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-6 mt-6">
      <CreateForm hasLocation={hasLocation} roles={roles} locations={locations} />
      <div className="card">
        <h2 className="font-extrabold text-lg">Your postings</h2>
        <ul className="mt-3 space-y-4">
          {postings.length === 0 && (
            <li className="text-sm text-[color:var(--brand-ink-muted)]">
              No postings yet. Create one to get a shareable link and QR code.
            </li>
          )}
          {postings.map((p) => (
            <PostingItem key={p.id} posting={p} roles={roles} locations={locations} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function CreateForm({
  hasLocation,
  roles,
  locations,
}: {
  hasLocation: boolean;
  roles: string[];
  locations: StoreOption[];
}) {
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
        Pick a role to hire for — you get a shareable link + QR for in-store
        flyers.
      </p>
      {!hasLocation && (
        <p className="mt-3 text-sm text-[color:var(--brand-pink-600)]">
          Set up your store profile first, then come back to post.
        </p>
      )}
      <form action={onSubmit} className="mt-4 space-y-3">
        <div>
          <label className="label">Role</label>
          <select className="input" name="title" defaultValue={roles[0] ?? ""}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[color:var(--brand-ink-muted)]">
            Edit your role list in Store setup.
          </p>
        </div>
        {locations.length > 1 && (
          <div>
            <label className="label">Store</label>
            <select className="input" name="location_id" defaultValue={locations[0]?.id ?? ""}>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}
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

function PostingItem({
  posting,
  roles,
  locations,
}: {
  posting: PostingView;
  roles: string[];
  locations: StoreOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function saveEdit(formData: FormData) {
    setError(null);
    const title = (formData.get("title") ?? "").toString();
    const locationId = (formData.get("location_id") ?? "").toString();
    startTransition(async () => {
      const res = await updatePosting(posting.id, title, locationId);
      if (res.ok) setEditing(false);
      else setError(res.error);
    });
  }

  function onDelete() {
    if (
      !confirm(
        "Delete this posting? The link/QR stop working. Anyone who already applied keeps their record."
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await deletePosting(posting.id);
      if (!res.ok) setError(res.error);
    });
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-[color:var(--brand-line)] p-4">
        <form action={saveEdit} className="space-y-3">
          <div>
            <label className="label">Role</label>
            <select className="input" name="title" defaultValue={posting.title}>
              {/* keep the current value selectable even if it's not in the role list anymore */}
              {!roles.includes(posting.title) && (
                <option value={posting.title}>{posting.title}</option>
              )}
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          {locations.length > 1 && (
            <div>
              <label className="label">Store</label>
              <select
                className="input"
                name="location_id"
                defaultValue={posting.locationId ?? ""}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-[color:var(--brand-line)] p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold">
            {posting.title}
            {posting.location && (
              <span className="text-[color:var(--brand-ink-muted)] font-normal">
                {" · "}
                {posting.location}
              </span>
            )}
          </div>
          <div className="text-xs text-[color:var(--brand-ink-muted)] mt-0.5">
            <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)]">
              {posting.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-[color:var(--brand-pink-600)] hover:underline"
          >
            Edit
          </button>
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
          <button
            type="button"
            disabled={pending}
            onClick={onDelete}
            className="text-sm font-semibold text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

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
