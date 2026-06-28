import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { CareersCopy, CareersValue } from "@/lib/careers-copy";

/**
 * Draft per-org careers-page body copy with Claude, from what we know about the
 * operator (name, industry, the roles they hire) plus an excerpt of their own
 * website when available. Returns the same shape as lib/careers-copy.ts so it
 * drops straight into the editor and the page. Draft only — the operator edits
 * before it's saved.
 */

export async function generateCareersCopy(input: {
  orgName: string;
  industry?: string;
  roles?: string[];
  siteText?: string;
}): Promise<{ ok: true; copy: CareersCopy } | { ok: false; error: string }> {
  const ctx = [
    `Business name: ${input.orgName}`,
    input.industry ? `Industry: ${input.industry}` : "",
    input.roles?.length ? `Roles they hire for: ${input.roles.join(", ")}` : "",
    input.siteText
      ? `Excerpt from their website (for voice/specifics):\n${input.siteText.slice(0, 2500)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  let raw: string;
  try {
    const { text } = await generateText({
      model: anthropic(process.env.AI_MODEL ?? "claude-haiku-4-5"),
      prompt:
        `Write the body copy for ${input.orgName}'s hiring/careers page, aimed at entry-level applicants ` +
        `(part-time crew and full-time staff). Warm, honest, plain language at about a 7th-grade reading level. ` +
        `Make it specific to this business where the context allows; never generic-corporate filler.\n` +
        `Return ONLY a JSON object with these keys (no prose, no code fence):\n` +
        `- "subhead": a 1–2 sentence hook shown under the headline (max ~200 chars)\n` +
        `- "lookForIntro": 1–2 sentences introducing a "what we look for" section\n` +
        `- "values": an array of EXACTLY 6 objects {"emoji","title","body"} — the traits they want in a hire ` +
        `(title <= 24 chars; body a single sentence)\n` +
        `- "roleIntro": one sentence introducing "the role, straight up" (or "")\n` +
        `- "rolePoints": an array of 3 short strings describing the day-to-day\n\n` +
        ctx,
    });
    raw = text;
  } catch (e) {
    return {
      ok: false,
      error: `Couldn't draft copy (${e instanceof Error ? e.message : "AI error"}).`,
    };
  }

  const jsonStr = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "The draft came back unreadable — try again." };
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const values: CareersValue[] = Array.isArray(parsed.values)
    ? (parsed.values as unknown[])
        .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : null))
        .filter((x): x is Record<string, unknown> => !!x && !!str(x.title) && !!str(x.body))
        .slice(0, 6)
        .map((x) => ({
          emoji: str(x.emoji) || undefined,
          title: str(x.title),
          body: str(x.body),
        }))
    : [];

  const rolePoints: string[] = Array.isArray(parsed.rolePoints)
    ? (parsed.rolePoints as unknown[]).map(str).filter(Boolean).slice(0, 5)
    : [];

  const copy: CareersCopy = {
    subhead: str(parsed.subhead),
    lookForIntro: str(parsed.lookForIntro),
    values,
    roleIntro: str(parsed.roleIntro),
    rolePoints,
  };

  if (!copy.subhead && copy.values.length === 0) {
    return { ok: false, error: "The draft was empty — try again." };
  }
  return { ok: true, copy };
}
