"use client";

import { useRef, useState } from "react";
import {
  fetchBrandFromUrl,
  applyBrand,
  draftCareersCopy,
  uploadLogo,
} from "@/app/admin/settings/actions";
import { careersCopy, type CareersCopy } from "@/lib/careers-copy";
import type { BrandTokens } from "@/lib/brand-extract";
import type { OrgBranding } from "@/lib/supabase/types";

type Phase =
  | { type: "idle" }
  | { type: "loading"; msg: string }
  | { type: "error"; msg: string }
  | { type: "saving" }
  | { type: "saved" };

const SWATCHES: { key: keyof BrandTokens; label: string; fallback: string }[] = [
  { key: "primary_color", label: "Primary", fallback: "#ff2d87" },
  { key: "accent_color", label: "Accent", fallback: "#2bd4a8" },
  { key: "bg_color", label: "Background", fallback: "#fff7ee" },
  { key: "ink_color", label: "Text", fallback: "#1a1530" },
];

function tokensFromBranding(b: OrgBranding): BrandTokens {
  return {
    primary_color: b.primary_color,
    accent_color: b.accent_color,
    bg_color: b.bg_color,
    ink_color: b.ink_color,
    font_family: b.font_family,
    logo_url: b.logo_url,
  };
}

export default function BrandFromUrl({ branding }: { branding: OrgBranding }) {
  const [url, setUrl] = useState("");
  const [tokens, setTokens] = useState<BrandTokens>(() => tokensFromBranding(branding));
  const [copy, setCopy] = useState<CareersCopy>(() => careersCopy(branding));
  const [phase, setPhase] = useState<Phase>({ type: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);

  const busy = phase.type === "loading" || phase.type === "saving";

  async function onFetch(e: React.FormEvent) {
    e.preventDefault();
    setPhase({ type: "loading", msg: "Reading your site…" });
    try {
      const res = await fetchBrandFromUrl(url);
      if (res.ok) {
        setTokens(res.tokens);
        if (res.copy) setCopy(res.copy);
        setPhase({ type: "idle" });
      } else {
        setPhase({ type: "error", msg: res.error });
      }
    } catch {
      setPhase({ type: "error", msg: "Something went wrong. Try again." });
    }
  }

  async function onDraftCopy() {
    setPhase({ type: "loading", msg: "Drafting your copy…" });
    try {
      const res = await draftCareersCopy();
      if (res.ok) {
        setCopy(res.copy);
        setPhase({ type: "idle" });
      } else {
        setPhase({ type: "error", msg: res.error });
      }
    } catch {
      setPhase({ type: "error", msg: "Couldn't draft copy. Try again." });
    }
  }

  async function onUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhase({ type: "loading", msg: "Uploading logo…" });
    const fd = new FormData();
    fd.set("file", file);
    try {
      const res = await uploadLogo(fd);
      if (res.ok) {
        setTokens((t) => ({ ...t, logo_url: res.url }));
        setPhase({ type: "idle" });
      } else {
        setPhase({ type: "error", msg: res.error });
      }
    } catch {
      setPhase({ type: "error", msg: "Upload failed. Try again." });
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onApply() {
    setPhase({ type: "saving" });
    const res = await applyBrand({ tokens, copy });
    setPhase(res.ok ? { type: "saved" } : { type: "error", msg: res.error });
  }

  const setToken = (key: keyof BrandTokens, value: string) =>
    setTokens((t) => ({ ...t, [key]: value || undefined }));
  const setCopyField = <K extends keyof CareersCopy>(key: K, value: CareersCopy[K]) =>
    setCopy((c) => ({ ...c, [key]: value }));
  const setValue = (i: number, patch: Partial<CareersCopy["values"][number]>) =>
    setCopy((c) => ({
      ...c,
      values: c.values.map((v, idx) => (idx === i ? { ...v, ...patch } : v)),
    }));

  return (
    <div className="card mb-8">
      <h2 className="text-lg font-bold">Style &amp; write my page</h2>
      <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
        Paste your website and we&apos;ll pull your colors, logo, and font and
        draft your careers copy. Edit anything below, upload your own logo, then
        save.
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
        <button type="submit" className="btn-primary" disabled={busy || !url.trim()}>
          {phase.type === "loading" ? phase.msg : "Fetch brand & copy"}
        </button>
      </form>

      {phase.type === "error" && <p className="mt-3 text-sm text-red-600">{phase.msg}</p>}

      <div className="mt-6 border-t border-[color:var(--brand-line)] pt-6 space-y-6">
        {/* ---- Brand: logo + colors + font ---- */}
        <div>
          <div className="text-xs uppercase tracking-wide text-[color:var(--brand-ink-muted)] mb-2">
            Logo
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {tokens.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tokens.logo_url}
                alt="Logo"
                className="h-12 w-12 rounded object-contain border border-[color:var(--brand-line)]"
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onUploadLogo}
              className="text-sm"
            />
            {tokens.logo_url && (
              <button
                type="button"
                onClick={() => setToken("logo_url", "")}
                className="text-xs text-[color:var(--brand-ink-muted)] underline"
              >
                remove
              </button>
            )}
          </div>
        </div>

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

        {/* ---- Copy ---- */}
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-[color:var(--brand-ink-muted)]">
            Page copy
          </div>
          <button
            type="button"
            onClick={onDraftCopy}
            disabled={busy}
            className="text-xs font-semibold text-[color:var(--brand-pink-600)] underline"
          >
            ✨ Draft with AI
          </button>
        </div>

        <label className="block">
          <span className="label">Hero subhead</span>
          <textarea
            value={copy.subhead}
            onChange={(e) => setCopyField("subhead", e.target.value)}
            rows={2}
            className="input"
          />
        </label>

        <label className="block">
          <span className="label">&ldquo;What we look for&rdquo; intro</span>
          <textarea
            value={copy.lookForIntro}
            onChange={(e) => setCopyField("lookForIntro", e.target.value)}
            rows={2}
            className="input"
          />
        </label>

        <div>
          <span className="label">What we look for — values</span>
          <div className="space-y-2">
            {copy.values.map((v, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input
                  type="text"
                  value={v.emoji ?? ""}
                  onChange={(e) => setValue(i, { emoji: e.target.value })}
                  className="input w-12 text-center"
                  aria-label="emoji"
                />
                <input
                  type="text"
                  value={v.title}
                  onChange={(e) => setValue(i, { title: e.target.value })}
                  placeholder="Title"
                  className="input w-40"
                />
                <input
                  type="text"
                  value={v.body}
                  onChange={(e) => setValue(i, { body: e.target.value })}
                  placeholder="One sentence"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() =>
                    setCopyField(
                      "values",
                      copy.values.filter((_, idx) => idx !== i)
                    )
                  }
                  className="text-[color:var(--brand-ink-muted)] px-2 py-2"
                  aria-label="remove value"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setCopyField("values", [...copy.values, { emoji: "", title: "", body: "" }])
            }
            className="mt-2 text-xs font-semibold text-[color:var(--brand-pink-600)] underline"
          >
            + add value
          </button>
        </div>

        <label className="block">
          <span className="label">&ldquo;The role&rdquo; intro (optional)</span>
          <textarea
            value={copy.roleIntro}
            onChange={(e) => setCopyField("roleIntro", e.target.value)}
            rows={2}
            className="input"
          />
        </label>

        <div>
          <span className="label">The role — bullets</span>
          <div className="space-y-2">
            {copy.rolePoints.map((pt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={pt}
                  onChange={(e) =>
                    setCopyField(
                      "rolePoints",
                      copy.rolePoints.map((p, idx) => (idx === i ? e.target.value : p))
                    )
                  }
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() =>
                    setCopyField(
                      "rolePoints",
                      copy.rolePoints.filter((_, idx) => idx !== i)
                    )
                  }
                  className="text-[color:var(--brand-ink-muted)] px-2 py-2"
                  aria-label="remove bullet"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCopyField("rolePoints", [...copy.rolePoints, ""])}
            className="mt-2 text-xs font-semibold text-[color:var(--brand-pink-600)] underline"
          >
            + add bullet
          </button>
        </div>

        {/* ---- Apply ---- */}
        <div className="flex items-center gap-3 border-t border-[color:var(--brand-line)] pt-5">
          <button type="button" onClick={onApply} className="btn-primary" disabled={busy}>
            {phase.type === "saving" ? "Saving…" : "Apply to my page"}
          </button>
          {phase.type === "saved" && (
            <span className="text-sm text-green-700 font-medium">
              Saved — your careers page is live with this look.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
