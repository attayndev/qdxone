import type { OrgBranding } from "@/lib/supabase/types";
import { brandThemeCss, brandFontHref } from "@/lib/brand-theme";

/**
 * Injects an org's brand as `:root` variable overrides (and, best-effort, loads
 * its webfont) so every org-facing page — background, cards, buttons, text —
 * re-themes from `org.branding`. Renders nothing when the org has no brand set,
 * leaving the default QDX palette in place.
 *
 * Drop at the top of each public org page (landing, job posting, apply flow).
 */
export function BrandTheme({ branding }: { branding?: OrgBranding | null }) {
  const css = brandThemeCss(branding);
  const fontHref = brandFontHref(branding);
  if (!css && !fontHref) return null;
  return (
    <>
      {fontHref ? <link rel="stylesheet" href={fontHref} /> : null}
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
    </>
  );
}
