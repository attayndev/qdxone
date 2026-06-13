// Hand-rolled types for the org/branding shapes that the app reads through
// the service-role client. The generated `database.types.ts` (npm run db:types)
// covers row/insert/update shapes; these are the convenience views.

// Pricing v1 tiers. Solo | Operator are self-serve (derived from location
// count); Enterprise is the sales-led tier, set manually. See src/lib/plan.ts.
export type PlanTier = "solo" | "operator" | "enterprise";
export type OrgStatus = "trialing" | "active" | "past_due" | "canceled";
export type BillingCycle = "annual" | "monthly";
export type OrgRole = "owner" | "admin";

export type FieldMode = "hidden" | "optional" | "required";
export type CustomQuestionType = "short_text" | "long_text" | "yes_no";
export type CustomQuestion = {
  id: string;
  label: string;
  type: CustomQuestionType;
  required: boolean;
};

export interface OrgBranding {
  display_name?: string;
  location_subtitle?: string;
  hero_copy_eyebrow?: string;
  hero_copy_h1_pre?: string;
  hero_copy_h1_post?: string;
  industry?: string;
  primary_color?: string;
  // Operator-defined roles used when creating job postings.
  roles?: string[];
  // Optional job description per role name.
  role_descriptions?: Record<string, string>;
  // When false, applications don't auto-fire the assessment — the manager
  // reviews and sends it manually (filters joke applications). Default: auto.
  auto_send_assessment?: boolean;
  // Per-field visibility/requirement on the application form + custom questions.
  application_config?: {
    work_experience?: FieldMode;
    references?: FieldMode;
    custom_questions?: CustomQuestion[];
  };
}

export interface OrganizationRow {
  id: string;
  slug: string;
  name: string;
  branding: OrgBranding;
  plan: PlanTier;
  billing_cycle: BillingCycle | null;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  // Denormalized count of locations; drives tier, quota, seats, caps, and the
  // Stripe subscription quantity. Kept in sync by a DB trigger on `locations`.
  location_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrgMemberRow {
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}
