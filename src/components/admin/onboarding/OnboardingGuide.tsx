"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbox } from "@/components/admin/Lightbox";
import BrandStudio from "@/components/admin/BrandFromUrl";
import { saveLocation, saveAssessmentMode } from "@/app/admin/locations/actions";
import { createPosting } from "@/app/admin/postings/actions";
import { inviteMember } from "@/app/admin/team/actions";
import { setOnboardingDismissed } from "@/app/admin/onboarding/actions";
import { ShareStep } from "./ShareStep";
import type { OnboardingStatus, OnboardingLocation } from "@/lib/onboarding";
import type { OrgBranding } from "@/lib/supabase/types";

type StepId = "store" | "job" | "style" | "team" | "assessment" | "share";

const STEPS: {
  id: Exclude<StepId, "share">;
  title: string;
  blurb: string;
  done: (s: OnboardingStatus) => boolean;
}[] = [
  { id: "store", title: "Add your store", blurb: "Tell us where you're hiring.", done: (s) => s.hasStore },
  { id: "job", title: "Post your first job", blurb: "Pick a role — we'll draft the description.", done: (s) => s.hasJob },
  { id: "style", title: "Style your page", blurb: "Paste your website; we match your brand.", done: (s) => s.hasBranding },
  { id: "team", title: "Invite a manager", blurb: "Optional — add someone to help review.", done: (s) => s.hasTeam },
  { id: "assessment", title: "Choose how assessments send", blurb: "Auto-send, or review first.", done: (s) => s.assessmentSet },
];

export default function OnboardingGuide({
  status,
  locations,
  branding,
  careersUrl,
  orgName,
}: {
  status: OnboardingStatus;
  locations: OnboardingLocation[];
  branding: OrgBranding;
  careersUrl: string;
  orgName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<StepId | null>(null);
  const [expanded, setExpanded] = useState(false);

  const refresh = () => router.refresh();
  const close = () => {
    setOpen(null);
    setExpanded(false);
    refresh();
  };

  async function dismiss() {
    await setOnboardingDismissed(true);
    refresh();
  }
  async function relaunch() {
    await setOnboardingDismissed(false);
    refresh();
  }

  // Dismissed → collapse to a single re-launch link (the "run it again" option).
  if (status.dismissed) {
    return (
      <div className="mb-6">
        <button
          type="button"
          onClick={relaunch}
          className="text-sm font-semibold text-[color:var(--brand-pink-600)] underline"
        >
          {status.complete
            ? "Re-open setup guide"
            : `Finish setting up your store (${status.doneCount}/${status.total})`}
        </button>
      </div>
    );
  }

  const pct = Math.round((status.doneCount / status.total) * 100);
  const canShare = status.hasStore && status.hasJob;

  return (
    <div className="card mb-8 border-2 border-[color:var(--brand-pink-50)]">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black tracking-tight">
            {status.complete ? "🎉 You're all set up!" : `Welcome — let's get ${orgName} hiring`}
          </h2>
          <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
            {status.complete
              ? "Your careers page is live. Share it to start collecting applicants."
              : "About 5 minutes. Do these in any order — you can stop and come back."}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-xs text-[color:var(--brand-ink-muted)] underline whitespace-nowrap"
        >
          {status.complete ? "Hide this" : "I'll finish later"}
        </button>
      </div>

      {/* progress */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-[color:var(--brand-cream)] overflow-hidden">
          <div
            className="h-full bg-[color:var(--brand-pink)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-[color:var(--brand-ink-muted)]">
          {status.doneCount}/{status.total}
        </span>
      </div>

      {/* steps */}
      <ul className="mt-5 space-y-2">
        {STEPS.map((step) => {
          const done = step.done(status);
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => setOpen(step.id)}
                className="w-full flex items-center gap-3 text-left rounded-xl p-3 hover:bg-[color:var(--brand-cream)] transition-colors"
              >
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full grid place-items-center text-sm font-bold ${
                    done
                      ? "bg-[color:var(--brand-pink)] text-white"
                      : "border-2 border-[color:var(--brand-line)] text-[color:var(--brand-ink-muted)]"
                  }`}
                >
                  {done ? "✓" : ""}
                </span>
                <span className="flex-1">
                  <span className={`font-bold ${done ? "text-[color:var(--brand-ink-muted)] line-through" : ""}`}>
                    {step.title}
                  </span>
                  {!done && (
                    <span className="block text-xs text-[color:var(--brand-ink-muted)]">
                      {step.blurb}
                    </span>
                  )}
                </span>
                <span className="text-sm font-semibold text-[color:var(--brand-pink-600)]">
                  {done ? "Edit" : "Start"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* the payoff */}
      <button
        type="button"
        onClick={() => canShare && setOpen("share")}
        disabled={!canShare}
        className="btn-primary w-full mt-5 disabled:opacity-50"
      >
        {canShare ? "🔗 Get your careers page link & QR" : "Add a store + job to share your page"}
      </button>

      {/* step lightboxes */}
      <Lightbox
        open={open === "store"}
        onClose={close}
        title="Add your store"
        subtitle="Where are you hiring? You can add more stores later."
      >
        <StoreStep onDone={close} />
      </Lightbox>

      <Lightbox
        open={open === "job"}
        onClose={close}
        title="Post your first job"
        subtitle="Pick a role and the store. We'll draft the description for you."
      >
        <JobStep locations={locations} onDone={close} />
      </Lightbox>

      <Lightbox
        open={open === "style"}
        onClose={close}
        title="Style your careers page"
        subtitle="Paste your website — we'll match your colors, logo, and voice."
        expanded={expanded}
        onToggleExpand={() => setExpanded((v) => !v)}
      >
        <BrandStudio branding={branding} />
      </Lightbox>

      <Lightbox
        open={open === "team"}
        onClose={close}
        title="Invite a manager"
        subtitle="They'll be able to review candidates with you. Optional."
      >
        <TeamStep onDone={close} />
      </Lightbox>

      <Lightbox
        open={open === "assessment"}
        onClose={close}
        title="How should assessments send?"
        subtitle="You can change this any time in Settings."
      >
        <AssessmentStep onDone={close} />
      </Lightbox>

      <Lightbox
        open={open === "share"}
        onClose={close}
        title="🎉 Your careers page is ready"
        subtitle="Share the link online, or print the QR for your store window."
      >
        <ShareStep careersUrl={careersUrl} orgName={orgName} />
      </Lightbox>
    </div>
  );
}

// ─── Step panels ──────────────────────────────────────────────────────────

function Err({ msg }: { msg: string | null }) {
  return msg ? <p className="text-sm text-red-600 mt-2">{msg}</p> : null;
}

function StoreStep({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function action(fd: FormData) {
    setBusy(true);
    setErr(null);
    const res = await saveLocation(fd);
    setBusy(false);
    if (res.ok) onDone();
    else setErr(res.error);
  }
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label">Store name</span>
        <input name="name" required className="input" placeholder="16 Handles — New City" />
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="label">City</span>
          <input name="city" className="input" placeholder="New City" />
        </label>
        <label className="block">
          <span className="label">State</span>
          <input name="region" className="input" placeholder="NY" />
        </label>
      </div>
      <Err msg={err} />
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Save store"}
      </button>
    </form>
  );
}

function JobStep({
  locations,
  onDone,
}: {
  locations: OnboardingLocation[];
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (locations.length === 0) {
    return (
      <p className="text-sm text-[color:var(--brand-ink-muted)]">
        Add your store first, then come back to post a job.
      </p>
    );
  }

  async function action(fd: FormData) {
    setBusy(true);
    setErr(null);
    const res = await createPosting(fd);
    setBusy(false);
    if (res.ok) onDone();
    else setErr(res.error);
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label">Role</span>
        <input name="title" required className="input" placeholder="Crew member" />
      </label>
      {locations.length > 1 && (
        <label className="block">
          <span className="label">Store</span>
          <select name="location_id" className="input">
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {locations.length === 1 && (
        <input type="hidden" name="location_id" value={locations[0].id} />
      )}
      <Err msg={err} />
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? "Posting…" : "Post job"}
      </button>
      <p className="text-xs text-[color:var(--brand-ink-muted)]">
        You can write a description and tweak details after posting.
      </p>
    </form>
  );
}

function TeamStep({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function action(fd: FormData) {
    setBusy(true);
    setErr(null);
    const res = await inviteMember(fd);
    setBusy(false);
    if (res.ok) onDone();
    else setErr(res.error);
  }
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label">Manager email</span>
        <input name="email" type="email" required className="input" placeholder="manager@store.com" />
      </label>
      <Err msg={err} />
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Inviting…" : "Send invite"}
        </button>
        <button type="button" onClick={onDone} className="btn-ghost">
          Skip for now
        </button>
      </div>
    </form>
  );
}

function AssessmentStep({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function choose(autoSend: boolean) {
    setBusy(true);
    await saveAssessmentMode(autoSend);
    setBusy(false);
    onDone();
  }
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => choose(true)}
        className="w-full text-left rounded-xl border-2 border-[color:var(--brand-line)] p-4 hover:border-[color:var(--brand-pink)]"
      >
        <div className="font-bold">Auto-send (recommended)</div>
        <div className="text-sm text-[color:var(--brand-ink-muted)]">
          Every applicant gets the 5-minute assessment right after applying. Fastest funnel.
        </div>
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => choose(false)}
        className="w-full text-left rounded-xl border-2 border-[color:var(--brand-line)] p-4 hover:border-[color:var(--brand-pink)]"
      >
        <div className="font-bold">Review first</div>
        <div className="text-sm text-[color:var(--brand-ink-muted)]">
          You eyeball each application and send the assessment manually. Filters joke applications.
        </div>
      </button>
    </div>
  );
}
