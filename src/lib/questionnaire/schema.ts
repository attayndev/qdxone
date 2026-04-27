/**
 * Questionnaire definition. Each question is keyed by `id`. Multiple-
 * choice options carry per-category score deltas and optional risk
 * flags. Agreement-scale questions map 1-5 to a single category. Short
 * answers aren't auto-scored — they're left for the admin to read.
 *
 * Categories tracked:
 *   ownership      — internal locus of control, accountability
 *   coachability   — accepts feedback without defensiveness
 *   reliability    — punctuality, follow-through
 *   rule           — comfort with structure / rule acceptance
 *   productive     — useful without supervision
 *   customer       — customer-service instincts
 *
 * Risk flags surface to admins on the applicant detail page.
 */

export type Category =
  | "ownership"
  | "coachability"
  | "reliability"
  | "rule"
  | "productive"
  | "customer";

export const CATEGORY_LABELS: Record<Category, string> = {
  ownership: "Ownership",
  coachability: "Coachability",
  reliability: "Reliability",
  rule: "Rule Acceptance",
  productive: "Productive Without Supervision",
  customer: "Customer Attitude",
};

export type RiskFlagKey =
  | "phone_policy_concern"
  | "casual_about_lateness"
  | "rule_resistance"
  | "feedback_defensive"
  | "low_initiative"
  | "blame_shifting"
  | "weak_customer_instincts"
  | "low_ownership"
  | "commitment_concern";

export const RISK_FLAG_LABELS: Record<RiskFlagKey, string> = {
  phone_policy_concern: "Possible phone-policy issue",
  casual_about_lateness: "Casual attitude about lateness",
  rule_resistance: "Likely to challenge rules",
  feedback_defensive: "Defensive about feedback",
  low_initiative: "Low initiative when it's slow",
  blame_shifting: "Signs of blame-shifting",
  weak_customer_instincts: "Weak customer-service instincts",
  low_ownership: "Low ownership",
  commitment_concern: "Commitment / reliability concern",
};

export type Scores = Partial<Record<Category, number>>;

export type Choice = {
  value: string;
  label: string;
  scores?: Scores;
  flags?: RiskFlagKey[];
};

export type Question =
  | {
      id: string;
      kind: "single";
      category: Category;
      prompt: string;
      help?: string;
      choices: Choice[];
      required?: boolean;
    }
  | {
      id: string;
      kind: "agree";
      category: Category;
      prompt: string;
      help?: string;
      // 1-5 mapped to score delta. Default: [-2, -1, 0, 1, 2].
      scale?: [number, number, number, number, number];
      // Flag to apply if the answer is the most-disagree end.
      lowFlag?: RiskFlagKey;
      required?: boolean;
    }
  | {
      id: string;
      kind: "text";
      category?: Category; // for grouping; not auto-scored
      prompt: string;
      help?: string;
      placeholder?: string;
      minLength?: number;
      required?: boolean;
    }
  | {
      id: string;
      kind: "demographic";
      prompt: string;
      help?: string;
      choices: Array<{ value: string; label: string }>;
      required?: boolean;
    };

export const QUESTIONS: Question[] = [
  // -------------------------------------------------------------------
  // Quick contact confirm + age band
  // -------------------------------------------------------------------
  {
    id: "age_band",
    kind: "demographic",
    prompt: "How old are you?",
    required: true,
    choices: [
      { value: "under16", label: "Under 16" },
      { value: "16", label: "16" },
      { value: "17", label: "17" },
      { value: "18", label: "18" },
      { value: "19", label: "19" },
      { value: "20+", label: "20 or older" },
    ],
  },

  // -------------------------------------------------------------------
  // Reliability — punctuality
  // -------------------------------------------------------------------
  {
    id: "punctuality",
    kind: "single",
    category: "reliability",
    prompt: "What does being on time mean to you?",
    required: true,
    choices: [
      {
        value: "early",
        label: "Showing up 5–10 minutes before my shift, ready to work.",
        scores: { reliability: 4 },
      },
      {
        value: "on_dot",
        label: "Walking in right at my start time.",
        scores: { reliability: 1 },
      },
      {
        value: "few_min",
        label: "A few minutes late is fine as long as I tell someone.",
        scores: { reliability: -2 },
        flags: ["casual_about_lateness"],
      },
      {
        value: "depends",
        label: "It depends — life happens.",
        scores: { reliability: -3 },
        flags: ["casual_about_lateness", "commitment_concern"],
      },
    ],
  },

  // -------------------------------------------------------------------
  // Productive Without Supervision — slow shifts
  // -------------------------------------------------------------------
  {
    id: "slow_shift",
    kind: "single",
    category: "productive",
    prompt: "When work is slow, what do you usually do?",
    required: true,
    choices: [
      {
        value: "find_useful",
        label: "Look for something useful to do — wipe down, restock, prep.",
        scores: { productive: 4, ownership: 1 },
      },
      {
        value: "ask_manager",
        label: "Ask my manager what they'd like me to do next.",
        scores: { productive: 3 },
      },
      {
        value: "wait",
        label: "Wait until I'm told what to do.",
        scores: { productive: -2 },
        flags: ["low_initiative"],
      },
      {
        value: "easy",
        label: "Take it easy until it gets busy again.",
        scores: { productive: -3 },
        flags: ["low_initiative"],
      },
      {
        value: "chat",
        label: "Talk with coworkers until someone hands me another task.",
        scores: { productive: -2 },
        flags: ["low_initiative"],
      },
    ],
  },

  // -------------------------------------------------------------------
  // Phone policy comfort — CRITICAL
  // -------------------------------------------------------------------
  {
    id: "phone_policy",
    kind: "single",
    category: "rule",
    prompt:
      "Phones are left in the manager's office during your shift. Phone use on the floor is a firing offense. How do you feel about that?",
    help: "Be honest — we'd rather know now.",
    required: true,
    choices: [
      {
        value: "totally_fine",
        label: "Totally fine. I get why the rule exists.",
        scores: { rule: 4, ownership: 1 },
      },
      {
        value: "fine_with_breaks",
        label: "Fine, as long as I can check it on my break.",
        scores: { rule: 2 },
      },
      {
        value: "uneasy",
        label: "Honestly, that would be hard for me.",
        scores: { rule: -3 },
        flags: ["phone_policy_concern"],
      },
      {
        value: "deal_breaker",
        label: "That sounds like a deal-breaker.",
        scores: { rule: -5 },
        flags: ["phone_policy_concern", "rule_resistance"],
      },
    ],
  },

  // -------------------------------------------------------------------
  // Productive — what to do when phone isn't available + slow
  // -------------------------------------------------------------------
  {
    id: "no_phone_slow",
    kind: "single",
    category: "productive",
    prompt:
      "It's slow. Your phone is in the office. What's the best use of your time?",
    required: true,
    choices: [
      {
        value: "clean_prep",
        label: "Clean, restock, prep, or check the lobby and bathrooms.",
        scores: { productive: 4, ownership: 1 },
      },
      {
        value: "study_menu",
        label: "Re-read the menu, flavors, or specials so I know them cold.",
        scores: { productive: 3 },
      },
      {
        value: "ask",
        label: "Find a manager and ask what they need.",
        scores: { productive: 3 },
      },
      {
        value: "stand_around",
        label: "Stand near the counter and wait for the next customer.",
        scores: { productive: -2 },
        flags: ["low_initiative"],
      },
      {
        value: "chat_coworkers",
        label: "Hang out and chat with coworkers.",
        scores: { productive: -2 },
        flags: ["low_initiative"],
      },
    ],
  },

  // -------------------------------------------------------------------
  // Coachability — receiving correction
  // -------------------------------------------------------------------
  {
    id: "feedback_response",
    kind: "single",
    category: "coachability",
    prompt: "How do you usually respond when someone corrects you?",
    required: true,
    choices: [
      {
        value: "thanks_apply",
        label: "Thank them, ask a clarifying question, and apply it next time.",
        scores: { coachability: 4, ownership: 1 },
      },
      {
        value: "listen",
        label: "Listen, take it in, and try to do better.",
        scores: { coachability: 3 },
      },
      {
        value: "depends_who",
        label: "Depends who's giving the feedback and how they say it.",
        scores: { coachability: -1 },
      },
      {
        value: "frustrated",
        label: "Honestly, I usually feel frustrated or defensive.",
        scores: { coachability: -3 },
        flags: ["feedback_defensive"],
      },
    ],
  },

  // -------------------------------------------------------------------
  // Customer — handling an upset customer
  // -------------------------------------------------------------------
  {
    id: "upset_customer",
    kind: "single",
    category: "customer",
    prompt:
      "A customer is upset, and honestly it isn't really your fault. What do you do?",
    required: true,
    choices: [
      {
        value: "own_and_fix",
        label:
          "Stay calm, apologize for the experience, and try to fix it or get a manager.",
        scores: { customer: 4, ownership: 2 },
      },
      {
        value: "get_manager",
        label: "Get a manager right away — they'll handle it better.",
        scores: { customer: 2 },
      },
      {
        value: "explain",
        label: "Explain that it wasn't actually my fault so they understand.",
        scores: { customer: -2 },
        flags: ["weak_customer_instincts", "blame_shifting"],
      },
      {
        value: "shut_down",
        label: "Get quiet and wait for them to stop.",
        scores: { customer: -2 },
        flags: ["weak_customer_instincts"],
      },
    ],
  },

  // -------------------------------------------------------------------
  // Reliability — commitment vs. social plan
  // -------------------------------------------------------------------
  {
    id: "commitment",
    kind: "single",
    category: "reliability",
    prompt:
      "You're scheduled for a Friday night shift. A friend invites you to something fun that same night. What's your move?",
    required: true,
    choices: [
      {
        value: "work",
        label: "I work — I committed to the shift.",
        scores: { reliability: 4, ownership: 1 },
      },
      {
        value: "swap_early",
        label:
          "Try to find a coworker to swap with early, but if I can't, I work.",
        scores: { reliability: 3 },
      },
      {
        value: "call_out",
        label: "Call out — friends only invite you to stuff like this sometimes.",
        scores: { reliability: -4 },
        flags: ["commitment_concern", "casual_about_lateness"],
      },
      {
        value: "depends",
        label: "Depends on what the plan is.",
        scores: { reliability: -2 },
        flags: ["commitment_concern"],
      },
    ],
  },

  // -------------------------------------------------------------------
  // Ownership — locus of control
  // -------------------------------------------------------------------
  {
    id: "locus",
    kind: "single",
    category: "ownership",
    prompt:
      "When something goes wrong at work, the first thing you think about is usually…",
    required: true,
    choices: [
      {
        value: "my_part",
        label: "What part of this was on me, and what would I do differently?",
        scores: { ownership: 4, coachability: 1 },
      },
      {
        value: "fix_now",
        label: "How do I fix this right now and keep things moving?",
        scores: { ownership: 3, customer: 1 },
      },
      {
        value: "who_caused",
        label: "Who actually caused this?",
        scores: { ownership: -2 },
        flags: ["blame_shifting"],
      },
      {
        value: "not_my_fault",
        label: "Whether I'm going to get blamed for something that wasn't my fault.",
        scores: { ownership: -3 },
        flags: ["blame_shifting", "low_ownership"],
      },
    ],
  },

  // -------------------------------------------------------------------
  // Agreement scales
  // -------------------------------------------------------------------
  {
    id: "feedback_scale",
    kind: "agree",
    category: "coachability",
    prompt: "Feedback usually makes me better, even when it stings.",
    required: true,
    scale: [-3, -1, 0, 2, 3],
    lowFlag: "feedback_defensive",
  },
  {
    id: "rules_scale",
    kind: "agree",
    category: "rule",
    prompt:
      "Workplace rules usually exist for a reason, even when I don't fully agree with them.",
    required: true,
    scale: [-3, -1, 0, 2, 3],
    lowFlag: "rule_resistance",
  },

  // -------------------------------------------------------------------
  // Short-answer questions (admin reads — not auto-scored)
  // -------------------------------------------------------------------
  {
    id: "went_wrong",
    kind: "text",
    category: "ownership",
    prompt:
      "Tell me about a time something went wrong — at school, on a team, at home, or at a job — and what you did next.",
    placeholder:
      "What happened, what you did, and how it turned out. 3–6 sentences is plenty.",
    minLength: 60,
    required: true,
  },
  {
    id: "rule_followed",
    kind: "text",
    category: "rule",
    prompt:
      "Tell me about a rule at school, on a team, at a job, or at home that you didn't love but still followed. Why did you stick with it?",
    placeholder: "Short and honest is better than long and polished.",
    minLength: 40,
    required: true,
  },
  {
    id: "boring_work",
    kind: "text",
    category: "productive",
    prompt:
      "What kinds of work do people your age usually complain about? How do you handle those tasks?",
    placeholder: "Cleaning, restocking, etc. — whatever comes to mind.",
    minLength: 40,
    required: true,
  },
  {
    id: "reference_quote",
    kind: "text",
    category: "coachability",
    prompt:
      "If we asked a coach, teacher, or former manager about your attitude, what would they say?",
    placeholder: "What would they say honestly — good and bad?",
    minLength: 40,
    required: true,
  },
  {
    id: "background",
    kind: "text",
    prompt:
      "Tell us about your background — school, sports, clubs, volunteering, family responsibilities, or any work experience. No formal experience needed.",
    placeholder: "Whatever you'd want us to know.",
    minLength: 30,
    required: true,
  },
];

// -------------------------------------------------------------------
// Maximums (used to compute % of max for the recommendation tier)
// -------------------------------------------------------------------
export const CATEGORIES: Category[] = [
  "ownership",
  "coachability",
  "reliability",
  "rule",
  "productive",
  "customer",
];

/**
 * Per-org questionnaire customization. Substitutes the phone-policy
 * prompt + welcome strings using the org's branding fields. Falls back
 * to the canonical QUESTIONS array unchanged when no branding is set.
 */
import type { OrgBranding } from "@/lib/supabase/types";

export function buildQuestions(branding: OrgBranding): Question[] {
  const phoneEnabled = branding.phone_policy_enabled !== false;
  const phoneText =
    branding.phone_policy_text ??
    "Phones are left in the manager's office during your shift. Phone use on the floor is a firing offense.";

  return QUESTIONS.flatMap((q) => {
    if (q.id === "phone_policy") {
      if (!phoneEnabled) return [];
      return [{ ...q, prompt: `${phoneText} How do you feel about that?` }];
    }
    if (q.id === "no_phone_slow" && !phoneEnabled) {
      return [];
    }
    return [q];
  });
}

export function categoryMax(): Record<Category, number> {
  const max: Record<Category, number> = {
    ownership: 0,
    coachability: 0,
    reliability: 0,
    rule: 0,
    productive: 0,
    customer: 0,
  };
  for (const q of QUESTIONS) {
    if (q.kind === "single") {
      const best = Math.max(
        0,
        ...q.choices.map((c) =>
          Object.values(c.scores ?? {}).reduce(
            (a, b) => a + Math.max(0, b ?? 0),
            0
          )
        )
      );
      // Add the best per-category contribution from this question.
      for (const cat of CATEGORIES) {
        const top = Math.max(
          0,
          ...q.choices.map((c) => c.scores?.[cat] ?? 0)
        );
        max[cat] += top;
      }
      void best; // keep helpful for debugging
    } else if (q.kind === "agree") {
      const scale = q.scale ?? [-2, -1, 0, 1, 2];
      max[q.category] += Math.max(...scale);
    }
  }
  return max;
}
