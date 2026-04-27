"use client";

import { useState, useTransition } from "react";
import {
  createInvitation,
  expireInvitation,
  resendInvitation,
} from "@/app/admin/invitations/actions";
import type { InvitationRow } from "@/lib/supabase/types";

export default function InvitationsClient({
  invitations,
  baseUrl,
}: {
  invitations: InvitationRow[];
  baseUrl: string;
}) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = invitations.filter((i) =>
    filter === "all" ? true : i.status === filter
  );

  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-6 mt-6">
      <CreateForm baseUrl={baseUrl} />
      <div className="card">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-extrabold text-lg">All invitations</h2>
          <select
            className="input max-w-[180px] py-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="opened">Opened</option>
            <option value="started">Started</option>
            <option value="submitted">Submitted</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <ul className="mt-3 divide-y divide-[color:var(--brand-line)]">
          {filtered.length === 0 && (
            <li className="py-6 text-sm text-[color:var(--brand-ink-muted)]">
              No invitations yet.
            </li>
          )}
          {filtered.map((inv) => (
            <InvitationRowItem key={inv.id} inv={inv} baseUrl={baseUrl} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function CreateForm({ baseUrl }: { baseUrl: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<
    | { kind: "ok"; link: string; emailed: boolean }
    | { kind: "err"; message: string }
    | null
  >(null);

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await createInvitation(formData);
      if (!res.ok) {
        setResult({ kind: "err", message: res.error });
        return;
      }
      const link = `${baseUrl}/invite/${res.invitation.token}`;
      setResult({ kind: "ok", link, emailed: res.emailed });
    });
  }

  return (
    <div className="card">
      <h2 className="font-extrabold text-lg">New invitation</h2>
      <p className="text-[color:var(--brand-ink-muted)] text-sm mt-1">
        Optional fields personalize the welcome screen.
      </p>
      <form action={onSubmit} className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First name</label>
            <input className="input" name="first_name" />
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="input" name="last_name" />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" name="email" type="email" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" name="phone" type="tel" />
        </div>
        <div>
          <label className="label">Internal notes</label>
          <textarea
            className="input min-h-[80px]"
            name="notes"
            placeholder="Where you met, who referred them, etc."
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="send_email" />
          <span>Send invitation email now (requires email above)</span>
        </label>
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Creating…" : "Create invitation"}
        </button>
      </form>
      {result?.kind === "ok" && (
        <div className="mt-4 rounded-xl bg-[color:var(--brand-pink-50)] p-3 text-sm">
          <p className="font-semibold">Invitation created.</p>
          {result.emailed ? (
            <p className="mt-1">Email sent. You can also copy the link:</p>
          ) : (
            <p className="mt-1">Copy this link to send manually:</p>
          )}
          <CopyableLink link={result.link} />
        </div>
      )}
      {result?.kind === "err" && (
        <p className="mt-3 text-sm text-red-600">{result.message}</p>
      )}
    </div>
  );
}

function InvitationRowItem({
  inv,
  baseUrl,
}: {
  inv: InvitationRow;
  baseUrl: string;
}) {
  const [pending, startTransition] = useTransition();
  const link = `${baseUrl}/invite/${inv.token}`;
  const name =
    [inv.first_name, inv.last_name].filter(Boolean).join(" ") ||
    inv.email ||
    "Unnamed";
  return (
    <li className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="min-w-0">
        <div className="font-semibold truncate">{name}</div>
        <div className="text-xs text-[color:var(--brand-ink-muted)] flex flex-wrap gap-2">
          {inv.email && <span>{inv.email}</span>}
          <span>·</span>
          <span>Created {new Date(inv.created_at).toLocaleDateString()}</span>
          {inv.expires_at && (
            <>
              <span>·</span>
              <span>
                Expires {new Date(inv.expires_at).toLocaleDateString()}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)]">
          {inv.status}
        </span>
        {!["submitted", "expired"].includes(inv.status) && (
          <>
            <CopyableLink link={link} compact />
            {inv.email && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await resendInvitation(inv.id);
                  })
                }
                className="text-sm font-semibold text-[color:var(--brand-pink-600)] hover:underline"
              >
                Resend
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await expireInvitation(inv.id);
                })
              }
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              Expire
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function CopyableLink({ link, compact }: { link: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // fallback: open in new tab
          window.open(link, "_blank");
        }
      }}
      className={
        compact
          ? "text-sm font-semibold text-[color:var(--brand-pink-600)] hover:underline"
          : "mt-2 inline-flex items-center gap-2 rounded-lg bg-white border border-[color:var(--brand-line)] px-3 py-2 text-xs font-mono break-all w-full text-left"
      }
      title={link}
    >
      {compact
        ? copied
          ? "Copied!"
          : "Copy link"
        : copied
          ? "Copied!"
          : link}
    </button>
  );
}
