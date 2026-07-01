/**
 * QDX brand tokens for the app — mirrors the web's --brand-* palette
 * (navy + amber). `blue` is the primary interactive color; `amber` is the only
 * accent, used sparingly. Kept in sync with src/app/globals.css.
 *
 * Nothing in the screens should hardcode a color — pull from `brand` (palette),
 * `tone` (badge/band bg+fg pairs), or `feedback` (alert/inline states).
 */
export const brand = {
  blue: "#43568a", // primary interactive
  blueDeep: "#16223d", // darker — pressed / emphasis / links
  soft: "#e8edf7", // soft blue tint — chips / fills
  ink: "#16223d",
  inkMuted: "#5a6b8c",
  slate: "#98a6be",
  amber: "#f6a623", // the accent
  amberDeep: "#db8f12",
  line: "#e7e3d9", // warm hairline
  cream: "#fbfaf7", // warm off-white canvas
  white: "#ffffff",
  mint: "#2bd4a8", // success
} as const;

/**
 * Semantic status tones as {bg, fg} pairs for badges, chips, and score bands
 * (High/Mid/Low, fit categories, posting status). Named by meaning, not color.
 */
export const tone = {
  success: { bg: "#e7f8ef", fg: "#166534" },
  successSolid: { bg: brand.mint, fg: brand.white },
  warning: { bg: "#fef3c7", fg: "#92400e" },
  danger: { bg: "#fee2e2", fg: "#b91c1c" },
  dangerSolid: { bg: "#dc2626", fg: brand.white },
  neutral: { bg: "#f1f5f9", fg: brand.inkMuted },
  info: { bg: brand.soft, fg: brand.blueDeep },
} as const;

/** Single-color feedback states for inline text, borders, and alert surfaces. */
export const feedback = {
  dangerText: "#b91c1c",
  dangerSolid: "#dc2626",
  positiveText: "#15803d",
  warnBorder: "#f59e0b",
  warnSurface: "#fffbeb",
  warnText: "#78350f",
} as const;

export type Tone = keyof typeof tone;
