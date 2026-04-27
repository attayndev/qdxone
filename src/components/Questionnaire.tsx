"use client";

import { useMemo, useState, useTransition } from "react";
import type { Question } from "@/lib/questionnaire/schema";
import type { SubmissionInput } from "@/app/apply/[token]/actions";

type Prefill = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

type Props = {
  token: string;
  questions: Question[];
  prefill: Prefill;
  submitAction: (
    token: string,
    input: SubmissionInput
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
};

type AnswerMap = Record<string, string>;

// One extra "step" precedes the questions: the contact-info step.
const CONTACT_KEY = "__contact__";

export default function Questionnaire({
  token,
  questions,
  prefill,
  submitAction,
}: Props) {
  const [step, setStep] = useState(0);
  const [contact, setContact] = useState<Prefill>(prefill);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const totalSteps = questions.length + 1; // +1 for contact
  const onContact = step === 0;
  const current = onContact ? null : questions[step - 1];
  const pct = ((step) / (totalSteps - 1)) * 100;

  const canAdvance = useMemo(() => {
    if (onContact) {
      return (
        contact.first_name.trim().length > 0 &&
        contact.last_name.trim().length > 0 &&
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)
      );
    }
    if (!current) return false;
    const a = answers[current.id];
    if (current.kind === "text") {
      const min = current.minLength ?? 0;
      return !!a && a.trim().length >= Math.max(20, min);
    }
    if (current.kind === "single" || current.kind === "demographic") {
      return !!a;
    }
    if (current.kind === "agree") {
      return !!a;
    }
    return false;
  }, [onContact, current, answers, contact]);

  function next() {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleSubmit();
    }
  }
  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  function handleSubmit() {
    setServerError(null);
    startTransition(async () => {
      const result = await submitAction(token, {
        contact: {
          first_name: contact.first_name.trim(),
          last_name: contact.last_name.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim(),
        },
        answers,
      });
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      window.location.href = `/apply/${encodeURIComponent(token)}/thank-you`;
    });
  }

  return (
    <div>
      {/* progress */}
      <div className="mb-6">
        <div className="h-2 rounded-full bg-[color:var(--brand-line)] overflow-hidden">
          <div
            className="h-full bg-[color:var(--brand-pink)] transition-all"
            style={{ width: `${Math.max(6, pct)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-[color:var(--brand-ink-muted)]">
          <span>Step {step + 1} of {totalSteps}</span>
          <span>About 5–7 min total</span>
        </div>
      </div>

      <div className="card">
        {onContact ? (
          <ContactStep contact={contact} setContact={setContact} />
        ) : current ? (
          <QuestionStep
            key={current.id}
            question={current}
            value={answers[current.id] ?? ""}
            onChange={(v) =>
              setAnswers((prev) => ({ ...prev, [current.id]: v }))
            }
          />
        ) : null}

        {serverError && (
          <p className="mt-4 text-sm text-red-600">{serverError}</p>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={back}
            disabled={step === 0 || pending}
            className="btn-ghost disabled:opacity-40"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!canAdvance || pending}
            className="btn-primary"
          >
            {step === totalSteps - 1
              ? pending
                ? "Submitting…"
                : "Submit application"
              : "Continue →"}
          </button>
        </div>
      </div>

      <p className="mt-4 text-xs text-[color:var(--brand-ink-muted)] text-center">
        Your answers are private. Only the manager will see them.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------
// Contact step
// ---------------------------------------------------------------------
function ContactStep({
  contact,
  setContact,
}: {
  contact: Prefill;
  setContact: (next: Prefill) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight">First, the basics</h2>
      <p className="text-[color:var(--brand-ink-muted)] mt-1">
        Confirm we can reach you.
      </p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">First name</label>
          <input
            className="input"
            value={contact.first_name}
            onChange={(e) =>
              setContact({ ...contact, first_name: e.target.value })
            }
            autoComplete="given-name"
          />
        </div>
        <div>
          <label className="label">Last name</label>
          <input
            className="input"
            value={contact.last_name}
            onChange={(e) =>
              setContact({ ...contact, last_name: e.target.value })
            }
            autoComplete="family-name"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
            autoComplete="email"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Phone (optional)</label>
          <input
            className="input"
            type="tel"
            inputMode="tel"
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            autoComplete="tel"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Single question renderer
// ---------------------------------------------------------------------
function QuestionStep({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
        {question.prompt}
      </h2>
      {question.kind !== "demographic" && question.kind !== "agree" && question.help && (
        <p className="text-[color:var(--brand-ink-muted)] mt-2">{question.help}</p>
      )}

      <div className="mt-5">
        {(question.kind === "single" || question.kind === "demographic") && (
          <ChoiceGroup
            choices={question.choices.map((c) => ({
              value: c.value,
              label: c.label,
            }))}
            value={value}
            onChange={onChange}
          />
        )}
        {question.kind === "agree" && (
          <AgreeScale value={value} onChange={onChange} />
        )}
        {question.kind === "text" && (
          <TextAnswer
            value={value}
            onChange={onChange}
            placeholder={question.placeholder}
            minLength={question.minLength}
          />
        )}
      </div>
    </div>
  );
}

function ChoiceGroup({
  choices,
  value,
  onChange,
}: {
  choices: Array<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      {choices.map((c) => {
        const selected = value === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className={[
              "w-full text-left rounded-2xl px-4 py-3 border transition",
              "flex items-start gap-3",
              selected
                ? "border-[color:var(--brand-pink)] bg-[color:var(--brand-pink-50)]"
                : "border-[color:var(--brand-line)] bg-white hover:border-[color:var(--brand-pink)]/60",
            ].join(" ")}
          >
            <span
              className={[
                "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2",
                selected
                  ? "border-[color:var(--brand-pink)] bg-[color:var(--brand-pink)]"
                  : "border-[color:var(--brand-line)] bg-white",
              ].join(" ")}
              aria-hidden
            />
            <span className="text-[15px] leading-snug">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AgreeScale({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === String(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(String(n))}
              className={[
                "flex-1 h-12 rounded-xl border-2 font-bold text-lg transition",
                selected
                  ? "border-[color:var(--brand-pink)] bg-[color:var(--brand-pink)] text-white"
                  : "border-[color:var(--brand-line)] bg-white text-[color:var(--brand-ink)] hover:border-[color:var(--brand-pink)]/60",
              ].join(" ")}
              aria-label={`${n} of 5`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-[color:var(--brand-ink-muted)]">
        <span>Strongly disagree</span>
        <span>Strongly agree</span>
      </div>
    </div>
  );
}

function TextAnswer({
  value,
  onChange,
  placeholder,
  minLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minLength?: number;
}) {
  const target = minLength ?? 60;
  const remaining = Math.max(0, target - value.trim().length);
  return (
    <div>
      <textarea
        className="input min-h-[140px] resize-y"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-2 text-xs text-[color:var(--brand-ink-muted)]">
        {remaining > 0
          ? `About ${remaining} more characters to go.`
          : "You can keep writing or move on."}
      </div>
    </div>
  );
}
