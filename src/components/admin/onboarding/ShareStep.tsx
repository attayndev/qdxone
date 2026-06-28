"use client";

import { useEffect, useState } from "react";

/**
 * The 0→1 payoff: the operator's live careers-page link, a copy button, a
 * printable QR (generated client-side), and a "view live" link. The QR is the
 * thing they tape in the store window.
 */
export function ShareStep({
  careersUrl,
  orgName,
}: {
  careersUrl: string;
  orgName: string;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const dataUrl = await QRCode.toDataURL(careersUrl, {
          width: 512,
          margin: 2,
          errorCorrectionLevel: "M",
        });
        if (alive) setQr(dataUrl);
      } catch {
        /* QR is a nice-to-have; the link still works */
      }
    })();
    return () => {
      alive = false;
    };
  }, [careersUrl]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(careersUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — they can still select the link */
    }
  }

  const fileSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "careers";

  return (
    <div className="space-y-5">
      <div>
        <span className="label">Your careers page link</span>
        <div className="flex gap-2">
          <input readOnly value={careersUrl} className="input flex-1 text-sm" />
          <button type="button" onClick={copy} className="btn-primary whitespace-nowrap">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--brand-line)] p-5 text-center">
        <p className="text-sm font-semibold text-[color:var(--brand-ink-muted)] mb-3">
          Print this and tape it in your window — people scan to apply.
        </p>
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="Careers page QR code" className="mx-auto w-44 h-44" />
        ) : (
          <div className="mx-auto w-44 h-44 grid place-items-center text-[color:var(--brand-ink-muted)] text-sm">
            Generating QR…
          </div>
        )}
        {qr && (
          <a
            href={qr}
            download={`${fileSlug}-careers-qr.png`}
            className="btn-ghost mt-4 inline-flex"
          >
            ⬇ Download QR
          </a>
        )}
      </div>

      <a href={careersUrl} target="_blank" rel="noreferrer" className="btn-ghost w-full inline-flex">
        View my live page ↗
      </a>
    </div>
  );
}
