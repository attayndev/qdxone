"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DaySlots } from "@/lib/scheduling/slots";
import type { BookSlotResult } from "@/app/interview/[token]/actions";

interface Selected {
  startIso: string;
  dayLabel: string;
  timeLabel: string;
}

export default function BookingClient({
  token,
  days,
  bookSlot,
  orgName,
}: {
  token: string;
  days: DaySlots[];
  bookSlot: (token: string, startIso: string) => Promise<BookSlotResult>;
  orgName: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Selected | null>(null);
  const [booked, setBooked] = useState<Selected | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (booked) {
    return (
      <div className="card mt-6 text-center">
        <div className="text-5xl">✅</div>
        <h2 className="mt-3 text-2xl font-black tracking-tight">You&apos;re booked!</h2>
        <p className="mt-2 text-[color:var(--brand-ink-muted)]">
          {booked.dayLabel} at {booked.timeLabel}
        </p>
        <p className="mt-2 text-sm text-[color:var(--brand-ink-muted)]">
          {orgName} will send a confirmation to your email with everything you need.
        </p>
      </div>
    );
  }

  function confirm() {
    if (!selected) return;
    setError(null);
    start(async () => {
      const r = await bookSlot(token, selected.startIso);
      if (r.ok) {
        setBooked(selected);
      } else {
        setError(r.message);
        setSelected(null);
        if (r.reason === "taken") router.refresh(); // drop the stale slot
      }
    });
  }

  return (
    <div className="mt-6">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {days.map((d) => (
          <div key={d.date}>
            <div className="font-semibold mb-2">{d.label}</div>
            <div className="flex flex-wrap gap-2">
              {d.slots.map((s) => {
                const isSel = selected?.startIso === s.startIso;
                return (
                  <button
                    key={s.startIso}
                    type="button"
                    onClick={() =>
                      setSelected({ startIso: s.startIso, dayLabel: d.label, timeLabel: s.label })
                    }
                    className={
                      "rounded-lg border px-3 py-2 text-sm font-medium transition " +
                      (isSel
                        ? "border-transparent bg-[color:var(--brand-pink)] text-white"
                        : "border-black/15 hover:bg-black/5")
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="sticky bottom-0 mt-6 -mx-4 sm:mx-0 border-t border-black/10 bg-white/95 backdrop-blur px-4 py-3 sm:rounded-lg sm:border">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              <span className="text-[color:var(--brand-ink-muted)]">Selected:</span>{" "}
              <span className="font-semibold">
                {selected.dayLabel} at {selected.timeLabel}
              </span>
            </div>
            <button onClick={confirm} disabled={pending} className="btn-primary">
              {pending ? "Booking…" : "Confirm booking"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
