"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbox } from "@/components/admin/Lightbox";
import BrandStudio from "@/components/admin/BrandFromUrl";
import {
  saveLocation,
  saveAssessmentMode,
  saveRoles,
  generateRoleDescription,
} from "@/app/admin/locations/actions";
import { createPosting } from "@/app/admin/postings/actions";
import { inviteMember } from "@/app/admin/team/actions";
import { setOnboardingDismissed } from "@/app/admin/onboarding/actions";
import { ShareStep } from "./ShareStep";
import type { OnboardingStatus, OnboardingLocation } from "@/lib/onboarding";
import type { OrgBranding } from "@/lib/supabase/types";

type StepId = "store" | "roles" | "job" | "style" | "team" | "assessment" | "share";

const STEPS: {
  id: Exclude<StepId, "share">;
  title: string;
  blurb: string;
  done: (s: OnboardingStatus) => boolean;
}[] = [
  { id: "store", title: "Add your store", blurb: "Tell us where you're hiring.", done: (s) => s.hasStore },
  { id: "roles", title: "Define your roles", blurb: "What jobs do you hire for? AI drafts each description.", done: (s) => s.hasRoles },
  { id: "job", title: "Post your first job", blurb: "Pick a role — it goes live.", done: (s) => s.hasJob },
  { id: "style", title: "Style your page", blurb: "Paste your website; we match your brand.", done: (s) => s.hasBranding },
  { id: "team", title: "Invite a manager", blurb: "Optional — add someone to help review.", done: (s) => s.hasTeam },
  { id: "assessment", title: "Choose how assessments send", blurb: "Auto-send, or review first.", done: (s) => s.assessmentSet },
];

export default function OnboardingGuide({
  status,
  locations,
  roles,
  branding,
  careersUrl,
  orgName,
}: {
  status: OnboardingStatus;
  locations: OnboardingLocation[];
  roles: string[];
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
        open={open === "roles"}
        onClose={close}
        title="Define your roles"
        subtitle="List the jobs you hire for. Jot a few bullet points and let AI write the description."
        expanded={expanded}
        onToggleExpand={() => setExpanded((v) => !v)}
      >
        <RolesStep
          initial={roles.map((name) => ({
            name,
            description: branding.role_descriptions?.[name] ?? "",
          }))}
          onDone={close}
        />
      </Lightbox>

      <Lightbox
        open={open === "job"}
        onClose={close}
        title="Post your first job"
        subtitle="Pick a role and the store — it goes live for applicants."
      >
        <JobStep roles={roles} locations={locations} onDone={close} />
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
  roles,
  locations,
  onDone,
}: {
  roles: string[];
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
  if (roles.length === 0) {
    return (
      <p className="text-sm text-[color:var(--brand-ink-muted)]">
        Define your roles first — then you can post one in a click.
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
        <select name="title" required className="input">
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
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
    </form>
  );
}

type RoleDraft = { name: string; brief: string; description: string };

function RolesStep({
  initial,
  onDone,
}: {
  initial: { name: string; description: string }[];
  onDone: () => void;
}) {
  const [rolesList, setRolesList] = useState<RoleDraft[]>(
    initial.length
      ? initial.map((r) => ({ name: r.name, brief: "", description: r.description }))
      : [{ name: "", brief: "", description: "" }]
  );
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const patch = (i: number, p: Partial<RoleDraft>) =>
    setRolesList((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...p } : r)));

  async function writeWithAi(i: number) {
    const role = rolesList[i];
    if (!role.name.trim()) {
      setErr("Name the role first, then ✨ Write with AI.");
      return;
    }
    setErr(null);
    setAiBusy(i);
    const res = await generateRoleDescription(role.name.trim(), role.brief.trim());
    setAiBusy(null);
    if (res.ok) patch(i, { description: res.text });
    else setErr(res.error);
  }

  async function save() {
    setBusy(true);
    setErr(null);
    const res = await saveRoles(
      rolesList
        .filter((r) => r.name.trim())
        .map((r) => ({ name: r.name.trim(), description: r.description.trim() || undefined }))
    );
    setBusy(false);
    if (res.ok) onDone();
    else setErr(res.error);
  }

  return (
    <div className="space-y-5">
      {rolesList.map((role, i) => (
        <div key={i} className="rounded-2xl border border-[color:var(--brand-line)] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={role.name}
              onChange={(e) => patch(i, { name: e.target.value })}
              placeholder="Role name (e.g. Crew Member)"
              className="input flex-1 font-semibold"
            />
            {rolesList.length > 1 && (
              <button
                type="button"
                onClick={() => setRolesList((rs) => rs.filter((_, idx) => idx !== i))}
                className="text-[color:var(--brand-ink-muted)] px-2 py-2"
                aria-label="remove role"
              >
                ×
              </button>
            )}
          </div>

          <label className="block">
            <span className="label">A few bullet points (optional)</span>
            <textarea
              value={role.brief}
              onChange={(e) => patch(i, { brief: e.target.value })}
              rows={2}
              placeholder="• weekends • cash handling • loves people"
              className="input"
            />
          </label>

          <button
            type="button"
            onClick={() => writeWithAi(i)}
            disabled={aiBusy === i}
            className="btn-ghost text-sm"
          >
            {aiBusy === i ? "Writing…" : "✨ Write with AI"}
          </button>
          <p className="text-xs text-[color:var(--brand-ink-muted)] -mt-1">
            Jot a few bullet points above and AI turns them into a full,
            friendly job description. You can edit it after.
          </p>

          <label className="block">
            <span className="label">Job description</span>
            <textarea
              value={role.description}
              onChange={(e) => patch(i, { description: e.target.value })}
              rows={5}
              placeholder="Write it yourself, or use ✨ Write with AI above."
              className="input"
            />
          </label>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setRolesList((rs) => [...rs, { name: "", brief: "", description: "" }])}
        className="text-xs font-semibold text-[color:var(--brand-pink-600)] underline"
      >
        + add another role
      </button>

      <Err msg={err} />
      <button type="button" onClick={save} className="btn-primary w-full" disabled={busy}>
        {busy ? "Saving…" : "Save roles"}
      </button>
    </div>
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
