"use client";

import { useState, useTransition } from "react";
import {
  createPosting,
  setPostingStatus,
  updatePosting,
  deletePosting,
} from "@/app/admin/postings/actions";
import { formatPay } from "@/lib/pay";
import type { FieldMode } from "@/lib/supabase/types";

/** Pay-range + tips inputs, shared by the create and edit forms. */
function PayFields({
  min,
  max,
  period,
  tips,
}: {
  min?: number | null;
  max?: number | null;
  period?: "hour" | "year";
  tips?: boolean;
}) {
  return (
    <div>
      <label className="label">Pay range</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="pay_min"
          type="number"
          step="0.01"
          min="0"
          className="input w-24"
          placeholder="Min"
          defaultValue={min ?? ""}
          required
        />
        <span className="text-[color:var(--brand-ink-muted)]">to</span>
        <input
          name="pay_max"
          type="number"
          step="0.01"
          min="0"
          className="input w-24"
          placeholder="Max"
          defaultValue={max ?? ""}
          required
        />
        <select name="pay_period" className="input w-auto" defaultValue={period ?? "hour"}>
          <option value="hour">/ hour</option>
          <option value="year">/ year</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm mt-2">
        <input
          type="checkbox"
          name="tips"
          defaultChecked={tips ?? false}
          className="h-4 w-4 accent-[color:var(--brand-blue)]"
        />
        This role earns tips (shows &ldquo;+ tips&rdquo;)
      </label>
      <p className="mt-1 text-xs text-[color:var(--brand-ink-muted)]">
        Required: NY and several states require a good-faith pay range on every job ad.
      </p>
    </div>
  );
}

/** Per-posting override for work history + references (blank = store default). */
function ApplicationFields({
  workMode,
  refsMode,
}: {
  workMode?: FieldMode | null;
  refsMode?: FieldMode | null;
}) {
  return (
    <div>
      <label className="label">Application fields</label>
      <p className="mt-1 mb-2 text-xs text-[color:var(--brand-ink-muted)]">
        Set how work history and references appear on this posting.
        &ldquo;Store default&rdquo; uses your Store setup.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">
          <span className="block text-xs text-[color:var(--brand-ink-muted)] mb-0.5">
            Work history
          </span>
          <select name="work_experience_mode" className="input" defaultValue={workMode ?? ""}>
            <option value="">Store default</option>
            <option value="optional">Optional</option>
            <option value="required">Required</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs text-[color:var(--brand-ink-muted)] mb-0.5">
            References
          </span>
          <select name="references_mode" className="input" defaultValue={refsMode ?? ""}>
            <option value="">Store default</option>
            <option value="optional">Optional</option>
            <option value="required">Required</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export type PostingView = {
  id: string;
  title: string;
  status: "draft" | "open" | "closed";
  url: string;
  qrSvg: string;
  locationId?: string | null;
  location?: string | null;
  payMin?: number | null;
  payMax?: number | null;
  payPeriod?: "hour" | "year";
  tips?: boolean;
  workExperienceMode?: FieldMode | null;
  referencesMode?: FieldMode | null;
};

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "careers";

/** Download an SVG QR string as a file (prints sharp at any size). */
function downloadQr(svg: string, name: string) {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(name)}-qr.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Native share sheet on mobile; falls back to copying the link. */
async function shareLink(url: string, title: string) {
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ title, url });
    } catch {
      /* user cancelled */
    }
  } else {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.open(url, "_blank");
    }
  }
}

const LINK_BTN =
  "text-sm font-semibold text-[color:var(--brand-blue-600)] hover:underline";

/** Open Facebook's share dialog for a URL (FB scrapes the page's preview). */
function fbShare(url: string) {
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    "_blank",
    "noopener,noreferrer,width=680,height=640"
  );
}

function postingBlurb(p: PostingView, orgName: string): string {
  const pay = formatPay({
    min: p.payMin,
    max: p.payMax,
    period: p.payPeriod ?? "hour",
    tips: p.tips ?? false,
  });
  const where = p.location || orgName;
  return `We're hiring: ${p.title}${where ? ` at ${where}` : ""}${pay ? ` — ${pay}` : ""}. Apply in 2 minutes, no login needed: ${p.url}`;
}

/**
 * Facebook one-click + a ready-to-paste job blurb — for the boards that have no
 * clean prefill URL (Craigslist, Nextdoor, Facebook groups, free Indeed posts).
 */
function ShareExtras({ url, blurb }: { url: string; blurb: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <button type="button" onClick={() => fbShare(url)} className={LINK_BTN}>
        Facebook
      </button>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(blurb);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked */
          }
        }}
        className={LINK_BTN}
        title="Copy a ready-to-paste post for Craigslist, Nextdoor, Facebook groups, etc."
      >
        {copied ? "Copied post!" : "Copy post"}
      </button>
    </>
  );
}

type StoreOption = { id: string; name: string };

export default function PostingsClient({
  postings,
  hasLocation,
  roles,
  locations,
  careers,
  orgName,
}: {
  postings: PostingView[];
  hasLocation: boolean;
  roles: string[];
  locations: StoreOption[];
  careers: { url: string; qrSvg: string };
  orgName: string;
}) {
  return (
    <div className="mt-6 space-y-6">
      <CareersShareCard careers={careers} orgName={orgName} />
      <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
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
            <PostingItem key={p.id} posting={p} roles={roles} locations={locations} orgName={orgName} />
          ))}
        </ul>
        </div>
      </div>
    </div>
  );
}

function CareersShareCard({
  careers,
  orgName,
}: {
  careers: { url: string; qrSvg: string };
  orgName: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="card">
      <h2 className="font-extrabold text-lg">Your careers page</h2>
      <p className="text-[color:var(--brand-ink-muted)] text-sm mt-1">
        One link + QR for <strong>all</strong> your open roles — share it
        anywhere, or print it for the window.
      </p>
      <div className="mt-3 flex flex-col sm:flex-row gap-4 items-start">
        <div
          className="shrink-0 rounded-lg bg-white p-2 border border-[color:var(--brand-line)] [&>svg]:w-28 [&>svg]:h-28"
          dangerouslySetInnerHTML={{ __html: careers.qrSvg }}
        />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs break-all">{careers.url}</div>
          <div className="mt-2 flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(careers.url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  window.open(careers.url, "_blank");
                }
              }}
              className={LINK_BTN}
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button type="button" onClick={() => shareLink(careers.url, "Careers")} className={LINK_BTN}>
              Share
            </button>
            <ShareExtras
              url={careers.url}
              blurb={`${orgName} is hiring! See our open roles and apply in 2 minutes: ${careers.url}`}
            />
            <button type="button" onClick={() => downloadQr(careers.qrSvg, "careers")} className={LINK_BTN}>
              Download QR
            </button>
            <a href={careers.url} target="_blank" rel="noreferrer" className={LINK_BTN}>
              Open
            </a>
          </div>
        </div>
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
        <p className="mt-3 text-sm text-[color:var(--brand-blue-600)]">
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
        <PayFields />
        <ApplicationFields />
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
  orgName,
}: {
  posting: PostingView;
  roles: string[];
  locations: StoreOption[];
  orgName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function saveEdit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updatePosting(posting.id, formData);
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
          <PayFields
            min={posting.payMin}
            max={posting.payMax}
            period={posting.payPeriod}
            tips={posting.tips}
          />
          <ApplicationFields
            workMode={posting.workExperienceMode}
            refsMode={posting.referencesMode}
          />
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
          <div className="text-xs text-[color:var(--brand-ink-muted)] mt-0.5 flex items-center gap-2 flex-wrap">
            <span className="chip bg-[color:var(--brand-soft)] text-[color:var(--brand-blue-600)]">
              {posting.status}
            </span>
            {formatPay({
              min: posting.payMin,
              max: posting.payMax,
              period: posting.payPeriod ?? "hour",
              tips: posting.tips ?? false,
            }) ? (
              <span>{formatPay({ min: posting.payMin, max: posting.payMax, period: posting.payPeriod ?? "hour", tips: posting.tips ?? false })}</span>
            ) : (
              <span className="text-amber-700">⚠ No pay range — edit to comply</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-[color:var(--brand-blue-600)] hover:underline"
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
            className="text-sm font-semibold text-[color:var(--brand-blue-600)] hover:underline"
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
          <div className="mt-2 flex gap-3 flex-wrap">
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
              className={LINK_BTN}
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={() => shareLink(posting.url, posting.title)}
              className={LINK_BTN}
            >
              Share
            </button>
            <ShareExtras url={posting.url} blurb={postingBlurb(posting, orgName)} />
            <button
              type="button"
              onClick={() => downloadQr(posting.qrSvg, posting.title)}
              className={LINK_BTN}
            >
              Download QR
            </button>
            <a href={posting.url} target="_blank" rel="noreferrer" className={LINK_BTN}>
              Open
            </a>
          </div>
        </div>
      </div>
    </li>
  );
}
