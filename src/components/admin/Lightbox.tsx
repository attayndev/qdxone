"use client";

import { useEffect } from "react";

/**
 * Focused modal for the onboarding steps. Near-full-screen on mobile (owners
 * are often on a phone in the store), a centered card on desktop that the
 * caller can expand/contract. ESC and backdrop click close it.
 */
export function Lightbox({
  open,
  onClose,
  title,
  subtitle,
  expanded = false,
  onToggleExpand,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex sm:items-center justify-center bg-black/40 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`bg-[color:var(--brand-surface)] w-full flex flex-col shadow-xl
          h-full sm:h-auto sm:max-h-[92vh] sm:rounded-2xl
          ${expanded ? "sm:max-w-4xl" : "sm:max-w-xl"}`}
      >
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[color:var(--brand-line)]">
          <div>
            <h2 className="text-xl font-black tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-sm text-[color:var(--brand-ink-muted)] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {onToggleExpand && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="hidden sm:inline-flex p-2 rounded-lg hover:bg-[color:var(--brand-cream)] text-[color:var(--brand-ink-muted)]"
                aria-label={expanded ? "Contract" : "Expand"}
                title={expanded ? "Contract" : "Expand"}
              >
                {expanded ? "🗗" : "🗖"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[color:var(--brand-cream)] text-[color:var(--brand-ink-muted)] text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 sm:px-6 py-5 flex-1">{children}</div>
      </div>
    </div>
  );
}
