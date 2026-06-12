// Lightweight, hand-rolled types. Replace with `npm run db:types`
// once a Supabase project is linked.

export type InvitationStatus =
  | "draft"
  | "sent"
  | "opened"
  | "started"
  | "submitted"
  | "expired";

export type HiringStatus =
  | "new"
  | "interview_requested"
  | "interviewed"
  | "rejected"
  | "hired";

export type Recommendation =
  | "strong_interview"
  | "interview"
  | "borderline"
  | "do_not_interview";

export type PlanTier = "starter" | "growth" | "pro" | "enterprise";
export type OrgStatus = "trialing" | "active" | "past_due" | "canceled";
export type BillingCycle = "annual" | "monthly";
export type OrgRole = "owner" | "admin";
export type TestTypeKey = "questionnaire" | "cashier_math" | "iq";

export interface OrgBranding {
  display_name?: string;
  location_subtitle?: string;
  hero_copy_eyebrow?: string;
  hero_copy_h1_pre?: string;
  hero_copy_h1_post?: string;
  industry?: string;
  primary_color?: string;
  phone_policy_enabled?: boolean;
  phone_policy_text?: string;
  // Custom rules to substitute into questionnaire prompts
  custom_rule_text?: string;
  custom_rule_label?: string;
  // Operator-defined role names used when creating job postings.
  roles?: string[];
  // Optional job description per role name.
  role_descriptions?: Record<string, string>;
  // When false, applications don't auto-fire the assessment — the manager
  // reviews and sends it manually (filters joke applications). Default: auto.
  auto_send_assessment?: boolean;
  // Per-field visibility/requirement on the application form.
  application_config?: {
    work_experience?: FieldMode;
    references?: FieldMode;
    custom_questions?: CustomQuestion[];
  };
}

export type FieldMode = "hidden" | "optional" | "required";

export type CustomQuestionType = "short_text" | "long_text" | "yes_no";

export type CustomQuestion = {
  id: string;
  label: string;
  type: CustomQuestionType;
  required: boolean;
};

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
  monthly_assessment_quota: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrgMemberRow {
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface OrgTestTypeRow {
  org_id: string;
  type_key: TestTypeKey;
  monthly_quota: number;
  overage_unit_cents: number;
  stripe_subscription_item_id: string | null;
  enabled: boolean;
  created_at: string;
}

export interface UsageEventRow {
  id: string;
  org_id: string;
  type_key: TestTypeKey;
  applicant_id: string | null;
  billing_period_start: string;
  is_overage: boolean;
  reported_to_stripe: boolean;
  created_at: string;
}

export interface InvitationRow {
  id: string;
  org_id: string;
  token: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: InvitationStatus;
  expires_at: string | null;
  sent_at: string | null;
  opened_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicantRow {
  id: string;
  org_id: string;
  invitation_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  age_band: string | null;
  hiring_status: HiringStatus;
  total_score: number | null;
  recommendation: Recommendation | null;
  category_scores: Record<string, number>;
  risk_flags: Array<{ key: string; label: string }>;
  submitted_at: string;
  created_at: string;
}

export interface ResponseRow {
  id: string;
  org_id: string;
  applicant_id: string;
  question_key: string;
  answer: unknown;
  created_at: string;
}

export interface AdminNoteRow {
  id: string;
  org_id: string;
  applicant_id: string;
  author_id: string | null;
  author_email: string | null;
  body: string;
  created_at: string;
}
