import type { CSSProperties } from "react";
import type { OrgBranding } from "@/lib/supabase/types";

/**
 * Per-org careers-page theming.
 *
 * The public landing + apply flow are built entirely on the app's `--brand-*`
 * CSS variables (see globals.css). To re-skin a page to an operator's brand we
 * don't touch any markup — we just override those variables on a wrapper
 * element from the tokens on `org.branding`. Only tokens that are set are
 * overridden; anything unset falls back to the default QDX palette.
 *
 * Shades (`-600` darker, `-50` light tint) and `-ink-muted` are derived from
 * the base tokens so buttons, chips, and muted text stay coherent with a single
 * primary/ink color.
 */

function parseHex(hex: string): [number, number, number] | null {
  const s0 = hex.trim().replace(/^#/, "");
  const s = s0.length === 3 ? s0.split("").map((c) => c + c).join("") : s0;
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

function toHex(rgb: [number, number, number]): string {
  return (
    "#" +
    rgb
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")
      )
      .join("")
  );
}

/** Mix `hex` toward `target` by `amount` (0..1). Returns `hex` unchanged if invalid. */
function mix(hex: string, target: [number, number, number], amount: number): string {
  const c = parseHex(hex);
  if (!c) return hex;
  return toHex([
    c[0] + (target[0] - c[0]) * amount,
    c[1] + (target[1] - c[1]) * amount,
    c[2] + (target[2] - c[2]) * amount,
  ]);
}

const BLACK: [number, number, number] = [0, 0, 0];
const WHITE: [number, number, number] = [255, 255, 255];

/**
 * Inline-style custom properties to set on a wrapper element so every
 * descendant built on `var(--brand-*)` re-themes to the org's brand.
 */
export function brandStyleVars(b: OrgBranding | null | undefined): CSSProperties {
  const vars: Record<string, string> = {};

  if (b?.primary_color && parseHex(b.primary_color)) {
    vars["--brand-pink"] = b.primary_color;
    vars["--brand-pink-600"] = mix(b.primary_color, BLACK, 0.18);
    vars["--brand-pink-50"] = mix(b.primary_color, WHITE, 0.88);
  }
  if (b?.accent_color && parseHex(b.accent_color)) {
    vars["--brand-mint"] = b.accent_color;
  }
  if (b?.bg_color && parseHex(b.bg_color)) {
    vars["--brand-cream"] = b.bg_color;
    vars["--brand-line"] = mix(b.bg_color, BLACK, 0.1);
  }
  if (b?.ink_color && parseHex(b.ink_color)) {
    vars["--brand-ink"] = b.ink_color;
    vars["--brand-ink-muted"] = mix(b.ink_color, WHITE, 0.3);
  }
  if (b?.font_family) {
    vars.fontFamily = b.font_family;
  }

  return vars as CSSProperties;
}
