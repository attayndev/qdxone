import type { OrgBranding } from "@/lib/supabase/types";

/**
 * Per-org careers-page theming.
 *
 * The public landing + apply flow are built on the app's `--brand-*` CSS
 * variables (globals.css). To re-skin to an operator's brand we override those
 * variables at `:root` (via a <style> injected by <BrandTheme>) — which repaints
 * the body background, cards, buttons, and text in one shot. We can't do this on
 * a wrapper element: the body sets its background from `:root`, an ancestor of
 * any page wrapper, so a descendant override wouldn't reach it.
 *
 * Only tokens that are set are overridden; the rest fall back to the default
 * palette. Shades (`-600`, `-50`, `-surface`, `-line`, `-ink-muted`) are derived
 * so a single primary/bg/ink stays coherent across buttons, cards, and borders.
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

/** Map an org's brand tokens onto `--brand-*` variable values. */
function brandVarMap(b: OrgBranding | null | undefined): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!b) return vars;

  if (b.primary_color && parseHex(b.primary_color)) {
    vars["--brand-pink"] = b.primary_color;
    vars["--brand-pink-600"] = mix(b.primary_color, BLACK, 0.18);
    vars["--brand-pink-50"] = mix(b.primary_color, WHITE, 0.88);
  }
  if (b.accent_color && parseHex(b.accent_color)) {
    vars["--brand-mint"] = b.accent_color;
  }
  if (b.bg_color && parseHex(b.bg_color)) {
    vars["--brand-cream"] = b.bg_color;
    vars["--background"] = b.bg_color;
    // Cards lift slightly toward white off the page background; borders sit
    // just darker than it.
    vars["--brand-surface"] = mix(b.bg_color, WHITE, 0.5);
    vars["--brand-line"] = mix(b.bg_color, BLACK, 0.12);
  }
  if (b.ink_color && parseHex(b.ink_color)) {
    vars["--brand-ink"] = b.ink_color;
    vars["--foreground"] = b.ink_color;
    vars["--brand-ink-muted"] = mix(b.ink_color, WHITE, 0.32);
  }
  return vars;
}

/** A `<style>`-ready `:root{…}` (plus body font) override, or "" if no tokens. */
export function brandThemeCss(b: OrgBranding | null | undefined): string {
  const vars = brandVarMap(b);
  const decls = Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  let css = decls ? `:root{${decls}}` : "";
  if (b?.font_family) {
    // Apply to the whole document; keep system fallbacks so it degrades cleanly
    // if the webfont didn't load.
    const fam = b.font_family.replace(/[<>]/g, "");
    css += `body{font-family:${fam}, ui-sans-serif, system-ui, sans-serif;}`;
  }
  return css;
}

/**
 * Best-effort Google Fonts href for the org's font, so a detected webfont
 * actually loads. Returns null for system fonts or anything that doesn't look
 * like a single family name.
 */
export function brandFontHref(b: OrgBranding | null | undefined): string | null {
  const fam = b?.font_family?.trim();
  if (!fam) return null;
  // Take the first family in the stack, strip quotes.
  const first = fam.split(",")[0].replace(/['"]/g, "").trim();
  // Skip generic/system families — they don't live on Google Fonts.
  const system = /^(inherit|initial|sans-serif|serif|monospace|system-ui|ui-sans-serif|-apple-system|arial|helvetica|georgia|times|roboto|verdana|tahoma)$/i;
  if (!first || first.length < 3 || system.test(first)) return null;
  const family = first.replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${family}:wght@400;600;700;800&display=swap`;
}
