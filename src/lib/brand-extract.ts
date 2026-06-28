import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

/**
 * Auto-brand extractor for "Style my page like <url>".
 *
 * We do NOT copy the site's CSS (it's written against their DOM and won't
 * transplant). Instead we scrape brand *signals* — theme-color, logo candidates,
 * font hints, and a frequency tally of saturated colors — and ask Claude to
 * resolve them into a clean token set that maps onto our --brand-* variables
 * (see lib/brand-theme.ts). The result is a DRAFT for the operator to preview
 * and accept; nothing is saved here.
 */

export type BrandTokens = {
  primary_color?: string;
  accent_color?: string;
  bg_color?: string;
  ink_color?: string;
  font_family?: string;
  logo_url?: string;
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

async function fetchText(url: string, maxBytes = 500_000): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "text/html,text/css,*/*" },
    signal: AbortSignal.timeout(12_000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const buf = await res.arrayBuffer();
  return new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, maxBytes));
}

function absUrl(base: string, href: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

/** Top saturated colors by frequency — drops near-grays / black / white noise. */
function colorTally(text: string): string[] {
  const counts = new Map<string, number>();
  for (const m of text.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
    const h = m[0].toLowerCase();
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  const dull = (h: string) => {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return Math.max(r, g, b) - Math.min(r, g, b) < 24; // low chroma → gray
  };
  return [...counts.entries()]
    .filter(([h]) => !dull(h))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([h, c]) => `${h} (${c})`);
}

function matchAll(re: RegExp, s: string): string[] {
  return [...s.matchAll(re)].map((m) => m[1]).filter(Boolean);
}

const hex = (s: string | undefined) =>
  s && /^#[0-9a-fA-F]{6}$/.test(s.trim()) ? s.trim().toLowerCase() : undefined;

/** Strip tags/scripts to a plain-text excerpt for downstream copy drafting. */
function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);
}

export async function extractBrandFromUrl(
  input: string
): Promise<
  | { ok: true; tokens: BrandTokens; source: string; siteText: string }
  | { ok: false; error: string }
> {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try {
    new URL(url);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }

  let html: string;
  try {
    html = await fetchText(url);
  } catch (e) {
    return {
      ok: false,
      error: `Couldn't load that site (${e instanceof Error ? e.message : "fetch failed"}). Try the full https:// URL, or set colors by hand.`,
    };
  }

  const theme = matchAll(
    /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/gi,
    html
  );
  const logos = [
    ...matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi, html),
    ...matchAll(
      /<link[^>]+rel=["'][^"']*(?:apple-touch-icon|icon)[^"']*["'][^>]+href=["']([^"']+)["']/gi,
      html
    ),
  ].map((h) => absUrl(url, h));
  const fonts = [
    ...matchAll(/fonts\.googleapis\.com\/css2?\?[^"']*family=([^"'&]+)/gi, html).map((f) =>
      decodeURIComponent(f).replace(/\+/g, " ")
    ),
    ...matchAll(/font-family:\s*([^;"'}]+)/gi, html),
  ];
  // Pull 1–2 linked stylesheets for richer color signal (best-effort).
  const cssLinks = matchAll(
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi,
    html
  )
    .map((h) => absUrl(url, h))
    .slice(0, 2);
  let css = "";
  for (const link of cssLinks) {
    try {
      css += " " + (await fetchText(link, 300_000));
    } catch {
      /* skip unreachable stylesheet */
    }
  }
  const colors = colorTally(html + css);
  const title = (html.match(/<title[^>]*>([^<]+)</i)?.[1] ?? "").trim();

  const evidence = [
    `Site: ${url}`,
    `Page title: ${title || "(none)"}`,
    `theme-color meta tags: ${theme.join(", ") || "none"}`,
    `Most frequent saturated colors (hex with count): ${colors.join(", ") || "none"}`,
    `Font hints: ${[...new Set(fonts)].slice(0, 8).join("  |  ") || "none"}`,
    `Logo image candidates: ${[...new Set(logos)].slice(0, 6).join("  |  ") || "none"}`,
  ].join("\n");

  let raw: string;
  try {
    const { text } = await generateText({
      model: anthropic(process.env.AI_MODEL ?? "claude-haiku-4-5"),
      prompt:
        `You extract a brand palette for a restaurant's hiring page from signals scraped off their website. ` +
        `Choose the actual BRAND colors, not incidental grays/black/white (use those only if they truly are the brand).\n` +
        `- primary_color: the dominant brand color\n` +
        `- accent_color: a secondary brand color (different hue from primary)\n` +
        `- bg_color: a light page background (often near-white or a soft cream)\n` +
        `- ink_color: a dark color for body text\n` +
        `- font_family: a usable CSS font-family stack ONLY if a real brand/display font is evident, else ""\n` +
        `- logo_url: the clearest logo candidate (prefer a larger PNG/SVG over a tiny favicon), else ""\n` +
        `All colors must be 6-digit hex (#rrggbb). If you genuinely can't tell a field, use "".\n` +
        `Respond with ONLY a JSON object with exactly those six keys — no prose, no code fence.\n\n` +
        evidence,
    });
    raw = text;
  } catch (e) {
    return {
      ok: false,
      error: `Couldn't analyze the brand (${e instanceof Error ? e.message : "AI error"}).`,
    };
  }

  const jsonStr = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return { ok: false, error: "The brand analysis came back unreadable — try again, or set colors by hand." };
  }

  const tokens: BrandTokens = {
    primary_color: hex(parsed.primary_color),
    accent_color: hex(parsed.accent_color),
    bg_color: hex(parsed.bg_color),
    ink_color: hex(parsed.ink_color),
    font_family: parsed.font_family?.trim() || undefined,
    logo_url: /^https?:\/\//.test((parsed.logo_url ?? "").trim())
      ? parsed.logo_url.trim()
      : undefined,
  };

  if (!tokens.primary_color && !tokens.logo_url) {
    return {
      ok: false,
      error: "Couldn't find a clear brand on that page. Try a different URL, or set colors by hand.",
    };
  }

  return { ok: true, tokens, source: url, siteText: visibleText(html) };
}
