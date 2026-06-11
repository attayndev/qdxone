"use client";

import { useState, useTransition } from "react";
import type { ApplicationInput } from "@/app/apply/[token]/actions";

type Props = {
  token: string;
  postingTitle: string;
  submitAction: (
    token: string,
    input: ApplicationInput
  ) => Promise<{ ok: true; assessmentToken?: string } | { ok: false; error: string }>;
};

const DAYS = [
  ["mon", "Mon"],
  ["tue", "Tue"],
  ["wed", "Wed"],
  ["thu", "Thu"],
  ["fri", "Fri"],
  ["sat", "Sat"],
  ["sun", "Sun"],
] as const;
const BLOCKS = [
  ["morning", "AM"],
  ["afternoon", "Mid"],
  ["evening", "PM"],
] as const;

type Job = { employer: string; role: string; dates: string };

export default function ApplicationForm({ token, postingTitle, submitAction }: Props) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [avail, setAvail] = useState<Record<string, string[]>>({});
  const [start, setStart] = useState("");
  const [jobs, setJobs] = useState<Job[]>([{ employer: "", role: "", dates: "" }]);
  const [refName, setRefName] = useState("");
  const [refContact, setRefContact] = useState("");

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const canSubmit =
    first.trim() && last.trim() && emailValid && eligible !== null;

  function toggle(day: string, block: string) {
    setAvail((prev) => {
      const cur = prev[day] ?? [];
      const next = cur.includes(block)
        ? cur.filter((b) => b !== block)
        : [...cur, block];
      return { ...prev, [day]: next };
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const input: ApplicationInput = {
        first_name: first.trim(),
        last_name: last.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        postal_code: zip.trim() || null,
        eligible_to_work: eligible === true,
        availability: Object.fromEntries(
          Object.entries(avail).filter(([, v]) => v.length > 0)
        ),
        work_history: jobs
          .filter((j) => j.employer.trim() || j.role.trim())
          .map((j) => ({
            employer: j.employer.trim(),
            role: j.role.trim(),
            dates: j.dates.trim(),
          })),
        job_references:
          refName.trim() || refContact.trim()
            ? [{ name: refName.trim(), contact: refContact.trim() }]
            : [],
        earliest_start_date: start || null,
      };
      const res = await submitAction(token, input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Continue straight into the assessment; fall back to thank-you.
      window.location.href = res.assessmentToken
        ? `/a/${encodeURIComponent(res.assessmentToken)}`
        : `/apply/${encodeURIComponent(token)}/thank-you`;
    });
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
        Apply — {postingTitle}
      </h1>
      <p className="text-[color:var(--brand-ink-muted)] mt-1">
        A few quick details. About 3 minutes.
      </p>

      {/* Contact */}
      <section className="card mt-6">
        <h2 className="font-extrabold">Your info</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="First name">
            <input className="input" value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" />
          </Field>
          <Field label="Last name">
            <input className="input" value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" />
          </Field>
          <Field label="Email" full>
            <input className="input" type="email" inputMode="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Mobile phone">
            <input className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </Field>
          <Field label="ZIP">
            <input className="input" inputMode="numeric" value={zip} onChange={(e) => setZip(e.target.value)} autoComplete="postal-code" />
          </Field>
        </div>
      </section>

      {/* Eligibility */}
      <section className="card mt-4">
        <h2 className="font-extrabold">Are you legally eligible to work in the US?</h2>
        <div className="mt-3 flex gap-3">
          {[["Yes", true], ["No", false]].map(([label, val]) => (
            <button
              key={label as string}
              type="button"
              onClick={() => setEligible(val as boolean)}
              className={[
                "flex-1 h-12 rounded-xl border-2 font-bold transition",
                eligible === val
                  ? "border-[color:var(--brand-pink)] bg-[color:var(--brand-pink)] text-white"
                  : "border-[color:var(--brand-line)] bg-white",
              ].join(" ")}
            >
              {label as string}
            </button>
          ))}
        </div>
      </section>

      {/* Availability */}
      <section className="card mt-4">
        <h2 className="font-extrabold">When can you work?</h2>
        <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">Tap all that apply.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-center text-sm">
            <thead>
              <tr>
                <th />
                {BLOCKS.map(([key, label]) => (
                  <th key={key} className="font-semibold pb-1">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(([day, dayLabel]) => (
                <tr key={day}>
                  <td className="text-left font-semibold pr-2 py-1">{dayLabel}</td>
                  {BLOCKS.map(([block]) => {
                    const on = (avail[day] ?? []).includes(block);
                    return (
                      <td key={block} className="py-1">
                        <button
                          type="button"
                          onClick={() => toggle(day, block)}
                          className={[
                            "w-10 h-9 rounded-lg border-2 transition",
                            on
                              ? "border-[color:var(--brand-pink)] bg-[color:var(--brand-pink)]"
                              : "border-[color:var(--brand-line)] bg-white",
                          ].join(" ")}
                          aria-label={`${day} ${block}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <Field label="Earliest start date">
            <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
        </div>
      </section>

      {/* Work history (optional) */}
      <section className="card mt-4">
        <h2 className="font-extrabold">Recent jobs <span className="font-normal text-[color:var(--brand-ink-muted)] text-sm">(optional)</span></h2>
        <div className="mt-3 space-y-4">
          {jobs.map((job, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input className="input" placeholder="Employer" value={job.employer} onChange={(e) => setJobs((j) => j.map((x, k) => (k === i ? { ...x, employer: e.target.value } : x)))} />
              <input className="input" placeholder="Role" value={job.role} onChange={(e) => setJobs((j) => j.map((x, k) => (k === i ? { ...x, role: e.target.value } : x)))} />
              <input className="input" placeholder="When" value={job.dates} onChange={(e) => setJobs((j) => j.map((x, k) => (k === i ? { ...x, dates: e.target.value } : x)))} />
            </div>
          ))}
          {jobs.length < 2 && (
            <button type="button" className="btn-ghost" onClick={() => setJobs((j) => [...j, { employer: "", role: "", dates: "" }])}>
              + Add another
            </button>
          )}
        </div>
      </section>

      {/* Reference (optional) */}
      <section className="card mt-4">
        <h2 className="font-extrabold">A reference <span className="font-normal text-[color:var(--brand-ink-muted)] text-sm">(optional)</span></h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input className="input" placeholder="Name" value={refName} onChange={(e) => setRefName(e.target.value)} />
          <input className="input" placeholder="Phone or email" value={refContact} onChange={(e) => setRefContact(e.target.value)} />
        </div>
      </section>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit || pending}
        className="btn-primary w-full mt-6 disabled:opacity-40"
      >
        {pending ? "Submitting…" : "Submit application"}
      </button>
      <p className="mt-3 text-xs text-[color:var(--brand-ink-muted)] text-center">
        Next, a short assessment — about 5 minutes, on your phone.
      </p>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
