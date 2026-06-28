"use client";

import { useState } from "react";
import { fetchBrandFromUrl, applyBrandTokens } from "@/app/admin/settings/actions";
import type { BrandTokens } from "@/lib/brand-extract";

type Phase =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "error"; msg: string }
  | { type: "ready" }
  | { type: "saving" }
  | { type: "saved" };

const SWATCHES: { key: keyof BrandTokens; label: string; fallback: string }[] = [
  { key: "primary_color", label: "Primary", fallback: "#ff2d87" },
  { key: "accent_color", label: "Accent", fallback: "#2bd4a8" },
  { key: "bg_color", label: "Background", fallback: "#fff7ee" },
  { key: "ink_color", label: "Text", fallback: "#1a1530" },
];

export default function BrandFromUrl() {
  const [url, setUrl] = useState("");
  const [tokens, setTokens] = useState<BrandTokens>({});
  const [phase, setPhase] = useState<Phase>({ type: "idle" });

  const loading = phase.type === "loading";

  async function onFetch(e: React.FormEvent) {
    e.preventDefault();
    setPhase({ type: "loading" });
    setTokens({});
    try {
      const res = await fetchBrandFromUrl(url);
      if (res.ok) {
        setTokens(res.tokens);
        setPhase({ type: "ready" });
      } else {
        setPhase({ type: "error", msg: res.error });
      }
    } catch {
      setPhase({ type: "error", msg: "Something went wrong. Try again." });
    }
  }

  function setToken(key: keyof BrandTokens, value: string) {
    setTokens((t) => ({ ...t, [key]: value || undefined }));
  }

  async function onApply() {
    setPhase({ type: "saving" });
    const res = await applyBrandTokens(tokens);
    setPhase(res.ok ? { type: "saved" } : { type: "error", msg: res.error });
  }

  return (
    <div className="card mb-8">
      <h2 className="text-lg font-bold">Style my page like…</h2>
      <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
        Paste your website and we&apos;ll pull your logo, colors, and font, then
        apply them to your careers page. You can tweak everything before saving.
      </p>

      <form onSubmit={onFetch} className="mt-4 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yourrestaurant.com"
          className="input flex-1"
          autoComplete="url"
        />
        <button type="submit" className="btn-primary" disabled={loading || !url.trim()}>
          {loading ? "Reading your site…" : "Fetch brand"}
        </button>
      </form>

      {phase.type === "error" && (
        <p className="mt-3 text-sm text-red-600">{phase.msg}</p>
      )}

      {(phase.type === "ready" || phase.type === "saving" || phase.type === "saved") && (
        <div className="mt-5 border-t border-[color:var(--brand-line)] pt-5">
          {tokens.logo_url && (
            <div className="mb-4">
              <div className="text-xs uppercase tracking-wide text-[color:var(--brand-ink-muted)] mb-1">
                Logo
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tokens.logo_url}
                alt="Detected logo"
                className="h-12 w-auto max-w-[220px] object-contain"
              />
              <input
                type="text"
                value={tokens.logo_url}
                onChange={(e) => setToken("logo_url", e.target.value)}
                className="input mt-2 w-full text-xs"
              />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SWATCHES.map(({ key, label, fallback }) => {
              const val = (tokens[key] as string | undefined) ?? "";
              return (
                <label key={key} className="block">
                  <span className="text-xs uppercase tracking-wide text-[color:var(--brand-ink-muted)]">
                    {label}
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={val || fallback}
                      onChange={(e) => setToken(key, e.target.value)}
                      className="h-9 w-9 rounded cursor-pointer border border-[color:var(--brand-line)] bg-transparent p-0"
                      aria-label={label}
                    />
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => setToken(key, e.target.value)}
                      placeholder={fallback}
                      className="input flex-1 text-xs font-mono"
                    />
                  </span>
                </label>
              );
            })}
          </div>

          {tokens.font_family && (
            <label className="block mt-3">
              <span className="text-xs uppercase tracking-wide text-[color:var(--brand-ink-muted)]">
                Font
              </span>
              <input
                type="text"
                value={tokens.font_family}
                onChange={(e) => setToken("font_family", e.target.value)}
                className="input mt-1 w-full text-xs"
              />
            </label>
          )}

          {/* live preview */}
          <div
            className="mt-5 rounded-2xl p-5 border border-[color:var(--brand-line)]"
            style={{
              background: tokens.bg_color ?? "#fff7ee",
              color: tokens.ink_color ?? "#1a1530",
              fontFamily: tokens.font_family || undefined,
            }}
          >
            <div className="text-xl font-black">Join the team.</div>
            <div className="mt-3 flex items-center gap-2">
              <span
                className="inline-block rounded-full px-4 py-2 text-white text-sm font-bold"
                style={{ background: tokens.primary_color ?? "#ff2d87" }}
              >
                Apply now
              </span>
              <span
                className="inline-block w-4 h-4 rounded-full"
                style={{ background: tokens.accent_color ?? "#2bd4a8" }}
              />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={onApply}
              className="btn-primary"
              disabled={phase.type === "saving"}
            >
              {phase.type === "saving" ? "Saving…" : "Apply to my page"}
            </button>
            {phase.type === "saved" && (
              <span className="text-sm text-green-700 font-medium">
                Saved — your careers page is live with this look.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
