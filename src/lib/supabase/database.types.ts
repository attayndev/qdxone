/**
 * Hand-rolled subset of the generated Supabase types. Mirrors
 * `supabase/migrations/0001_init.sql` + `0002_multitenant.sql`.
 *
 * Regenerate from your real schema with `npm run db:types`
 * once you've linked your Supabase project.
 */

import type {
  BillingCycle,
  HiringStatus,
  InvitationStatus,
  OrgBranding,
  OrgRole,
  PlanTier,
  Recommendation,
  TestTypeKey,
} from "./types";

type Json =
  | string
  | number
  | boolean
  | null
  | { [k: string]: Json | undefined }
  | Json[];

type Mutate<TRow, TRequired extends keyof TRow = never> = Partial<TRow> & {
  [K in TRequired]: TRow[K];
};

interface OrganizationsTable {
  Row: {
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
    created_at: string;
    updated_at: string;
  };
  Insert: Mutate<OrganizationsTable["Row"], "slug" | "name">;
  Update: Partial<OrganizationsTable["Row"]>;
  Relationships: [];
}

interface OrgMembersTable {
  Row: {
    org_id: string;
    user_id: string;
    role: OrgRole;
    created_at: string;
  };
  Insert: Mutate<OrgMembersTable["Row"], "org_id" | "user_id">;
  Update: Partial<OrgMembersTable["Row"]>;
  Relationships: [];
}

interface OrgTestTypesTable {
  Row: {
    org_id: string;
    type_key: TestTypeKey;
    monthly_quota: number;
    overage_unit_cents: number;
    stripe_subscription_item_id: string | null;
    enabled: boolean;
    created_at: string;
  };
  Insert: Mutate<OrgTestTypesTable["Row"], "org_id" | "type_key">;
  Update: Partial<OrgTestTypesTable["Row"]>;
  Relationships: [];
}

interface UsageEventsTable {
  Row: {
    id: string;
    org_id: string;
    type_key: TestTypeKey;
    applicant_id: string | null;
    billing_period_start: string;
    is_overage: boolean;
    reported_to_stripe: boolean;
    created_at: string;
  };
  Insert: Mutate<UsageEventsTable["Row"], "org_id">;
  Update: Partial<UsageEventsTable["Row"]>;
  Relationships: [];
}

interface InvitationsTable {
  Row: {
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
  };
  Insert: Mutate<InvitationsTable["Row"], "token" | "org_id">;
  Update: Partial<InvitationsTable["Row"]>;
  Relationships: [];
}

interface ApplicantsTable {
  Row: {
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
    category_scores: Json;
    risk_flags: Json;
    submitted_at: string;
    created_at: string;
  };
  Insert: Mutate<
    ApplicantsTable["Row"],
    "org_id" | "invitation_id" | "first_name" | "last_name" | "email"
  >;
  Update: Partial<ApplicantsTable["Row"]>;
  Relationships: [];
}

interface ResponsesTable {
  Row: {
    id: string;
    org_id: string;
    applicant_id: string;
    question_key: string;
    answer: Json;
    created_at: string;
  };
  Insert: Mutate<
    ResponsesTable["Row"],
    "org_id" | "applicant_id" | "question_key" | "answer"
  >;
  Update: Partial<ResponsesTable["Row"]>;
  Relationships: [];
}

interface AdminNotesTable {
  Row: {
    id: string;
    org_id: string;
    applicant_id: string;
    author_id: string | null;
    author_email: string | null;
    body: string;
    created_at: string;
  };
  Insert: Mutate<AdminNotesTable["Row"], "org_id" | "applicant_id" | "body">;
  Update: Partial<AdminNotesTable["Row"]>;
  Relationships: [];
}

interface AdminsTable {
  Row: {
    user_id: string;
    email: string;
    display_name: string | null;
    created_at: string;
  };
  Insert: Mutate<AdminsTable["Row"], "user_id" | "email">;
  Update: Partial<AdminsTable["Row"]>;
  Relationships: [];
}

interface AuditEventsTable {
  Row: {
    id: string;
    org_id: string | null;
    invitation_id: string | null;
    applicant_id: string | null;
    kind: string;
    meta: Json;
    created_at: string;
  };
  Insert: Mutate<AuditEventsTable["Row"], "kind">;
  Update: Partial<AuditEventsTable["Row"]>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      admins: AdminsTable;
      organizations: OrganizationsTable;
      org_members: OrgMembersTable;
      org_test_types: OrgTestTypesTable;
      usage_events: UsageEventsTable;
      invitations: InvitationsTable;
      applicants: ApplicantsTable;
      responses: ResponsesTable;
      admin_notes: AdminNotesTable;
      audit_events: AuditEventsTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      invitation_status: InvitationStatus;
      hiring_status: HiringStatus;
      recommendation: Recommendation;
      plan_tier: PlanTier;
      billing_cycle: BillingCycle;
      org_role: OrgRole;
      test_type_key: TestTypeKey;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
