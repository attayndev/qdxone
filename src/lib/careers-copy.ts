import type { OrgBranding } from "@/lib/supabase/types";

/**
 * The careers-page body copy — one place that owns both the defaults and the
 * per-org resolution. OrgLanding renders `careersCopy(org.branding)`; the AI
 * generator produces the same shape; the editor edits it. Every field falls
 * back to the default below when the org hasn't set (or AI-drafted) its own.
 */

export type CareersValue = { emoji?: string; title: string; body: string };

export type CareersCopy = {
  subhead: string;
  lookForIntro: string;
  values: CareersValue[];
  roleIntro: string;
  rolePoints: string[];
};

export const DEFAULT_SUBHEAD =
  "We're picky about who joins the crew. Strong attitude beats fancy resume. Apply in a few minutes, right from your phone.";

export const DEFAULT_LOOK_FOR_INTRO =
  "You don't need fancy work history. You need a strong attitude and the willingness to own your shift.";

export const DEFAULT_VALUES: CareersValue[] = [
  {
    emoji: "💪",
    title: "Ownership",
    body: "When something goes wrong, you ask 'what was my part?' before 'whose fault is this?'",
  },
  {
    emoji: "👂",
    title: "Coachability",
    body: "Feedback doesn't sting your ego — it sharpens you.",
  },
  {
    emoji: "⏰",
    title: "Reliability",
    body: "If you say you'll be there, you're there — five minutes early.",
  },
  {
    emoji: "📋",
    title: "Respect for the rules",
    body: "Even the ones you don't love.",
  },
  {
    emoji: "🧹",
    title: "Useful when it's slow",
    body: "Empty store? You're already wiping, restocking, prepping.",
  },
  {
    emoji: "😊",
    title: "Customer-first attitude",
    body: "When a guest is upset, you stay calm and make it right.",
  },
];

export const DEFAULT_ROLE_INTRO = "";

export const DEFAULT_ROLE_POINTS = [
  "Customer-facing. You'll be the face of the shop.",
  "Cleaning, restocking, and prep — the unglamorous stuff that keeps a great shop great.",
  "Teamwork, professionalism, and following the playbook.",
];

/** Resolve the effective careers copy for an org, default-filling each field. */
export function careersCopy(b: OrgBranding | null | undefined): CareersCopy {
  return {
    subhead: b?.hero_copy_subhead?.trim() || DEFAULT_SUBHEAD,
    lookForIntro: b?.look_for_intro?.trim() || DEFAULT_LOOK_FOR_INTRO,
    values: b?.values?.length ? b.values : DEFAULT_VALUES,
    roleIntro: b?.role_intro?.trim() || DEFAULT_ROLE_INTRO,
    rolePoints: b?.role_points?.length ? b.role_points : DEFAULT_ROLE_POINTS,
  };
}
