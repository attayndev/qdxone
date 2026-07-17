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
  "We hire for how you show up and how you treat people — not for a perfect resume. Take a few minutes to apply, right from your phone. We'd love to meet you.";

export const DEFAULT_LOOK_FOR_INTRO =
  "No long work history required — we can teach the job. Here's what we genuinely care about, and if it sounds like you, we'd love for you to apply.";

export const DEFAULT_VALUES: CareersValue[] = [
  {
    emoji: "⏰",
    title: "You show up",
    body: "When you say you'll be there, you're there — and your team knows they can count on you.",
  },
  {
    emoji: "💪",
    title: "You take pride in it",
    body: "You care how a shift turns out, and you own your part — the wins and the fixes.",
  },
  {
    emoji: "👂",
    title: "You're open to learning",
    body: "Feedback isn't a knock — it's how we all get a little better each day.",
  },
  {
    emoji: "😊",
    title: "You're good with people",
    body: "You stay warm and steady, and you can turn a guest's rough moment around.",
  },
  {
    emoji: "🤝",
    title: "You look out for the team",
    body: "Slow moment? You're already pitching in — wiping down, restocking, getting ready for the rush.",
  },
  {
    emoji: "✨",
    title: "You sweat the details",
    body: "The little things done right are what make a good shop a place people come back to.",
  },
];

export const DEFAULT_ROLE_INTRO = "";

export const DEFAULT_ROLE_POINTS = [
  "You'll be the face of the shop — greeting guests and making their day a little better.",
  "Keeping things clean, stocked, and ready — the work behind the scenes that keeps a great shop great.",
  "Working shoulder to shoulder with a team that has your back.",
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
