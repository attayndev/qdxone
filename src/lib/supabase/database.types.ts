export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_notes: {
        Row: {
          applicant_id: string
          author_email: string | null
          author_id: string | null
          body: string
          created_at: string
          id: string
          org_id: string
        }
        Insert: {
          applicant_id: string
          author_email?: string | null
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          org_id: string
        }
        Update: {
          applicant_id?: string
          author_email?: string | null
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          user_id?: string
        }
        Relationships: []
      }
      applicants: {
        Row: {
          age_band: string | null
          category_scores: Json
          created_at: string
          email: string
          first_name: string
          hiring_status: Database["public"]["Enums"]["hiring_status"]
          id: string
          invitation_id: string
          last_name: string
          org_id: string
          phone: string | null
          recommendation: Database["public"]["Enums"]["recommendation"] | null
          risk_flags: Json
          submitted_at: string
          total_score: number | null
        }
        Insert: {
          age_band?: string | null
          category_scores?: Json
          created_at?: string
          email: string
          first_name: string
          hiring_status?: Database["public"]["Enums"]["hiring_status"]
          id?: string
          invitation_id: string
          last_name: string
          org_id: string
          phone?: string | null
          recommendation?: Database["public"]["Enums"]["recommendation"] | null
          risk_flags?: Json
          submitted_at?: string
          total_score?: number | null
        }
        Update: {
          age_band?: string | null
          category_scores?: Json
          created_at?: string
          email?: string
          first_name?: string
          hiring_status?: Database["public"]["Enums"]["hiring_status"]
          id?: string
          invitation_id?: string
          last_name?: string
          org_id?: string
          phone?: string | null
          recommendation?: Database["public"]["Enums"]["recommendation"] | null
          risk_flags?: Json
          submitted_at?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "applicants_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: true
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          applicant_id: string | null
          created_at: string
          id: string
          invitation_id: string | null
          kind: string
          meta: Json
          org_id: string | null
        }
        Insert: {
          applicant_id?: string | null
          created_at?: string
          id?: string
          invitation_id?: string | null
          kind: string
          meta?: Json
          org_id?: string | null
        }
        Update: {
          applicant_id?: string | null
          created_at?: string
          id?: string
          invitation_id?: string | null
          kind?: string
          meta?: Json
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          opened_at: string | null
          org_id: string
          phone: string | null
          sent_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          submitted_at: string | null
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          opened_at?: string | null
          org_id: string
          phone?: string | null
          sent_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          submitted_at?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          opened_at?: string | null
          org_id?: string
          phone?: string | null
          sent_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          submitted_at?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_test_types: {
        Row: {
          created_at: string
          enabled: boolean
          monthly_quota: number
          org_id: string
          overage_unit_cents: number
          stripe_subscription_item_id: string | null
          type_key: Database["public"]["Enums"]["test_type_key"]
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          monthly_quota?: number
          org_id: string
          overage_unit_cents?: number
          stripe_subscription_item_id?: string | null
          type_key: Database["public"]["Enums"]["test_type_key"]
        }
        Update: {
          created_at?: string
          enabled?: boolean
          monthly_quota?: number
          org_id?: string
          overage_unit_cents?: number
          stripe_subscription_item_id?: string | null
          type_key?: Database["public"]["Enums"]["test_type_key"]
        }
        Relationships: [
          {
            foreignKeyName: "org_test_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"] | null
          branding: Json
          created_at: string
          id: string
          name: string
          plan: Database["public"]["Enums"]["plan_tier"]
          slug: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"] | null
          branding?: Json
          created_at?: string
          id?: string
          name: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          slug: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"] | null
          branding?: Json
          created_at?: string
          id?: string
          name?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          slug?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      responses: {
        Row: {
          answer: Json
          applicant_id: string
          created_at: string
          id: string
          org_id: string
          question_key: string
        }
        Insert: {
          answer: Json
          applicant_id: string
          created_at?: string
          id?: string
          org_id: string
          question_key: string
        }
        Update: {
          answer?: Json
          applicant_id?: string
          created_at?: string
          id?: string
          org_id?: string
          question_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          applicant_id: string | null
          billing_period_start: string
          created_at: string
          id: string
          is_overage: boolean
          org_id: string
          reported_to_stripe: boolean
          type_key: Database["public"]["Enums"]["test_type_key"]
        }
        Insert: {
          applicant_id?: string | null
          billing_period_start?: string
          created_at?: string
          id?: string
          is_overage?: boolean
          org_id: string
          reported_to_stripe?: boolean
          type_key?: Database["public"]["Enums"]["test_type_key"]
        }
        Update: {
          applicant_id?: string | null
          billing_period_start?: string
          created_at?: string
          id?: string
          is_overage?: boolean
          org_id?: string
          reported_to_stripe?: boolean
          type_key?: Database["public"]["Enums"]["test_type_key"]
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_org_member: { Args: { p_org: string }; Returns: boolean }
      is_org_owner: { Args: { p_org: string }; Returns: boolean }
    }
    Enums: {
      billing_cycle: "annual" | "monthly"
      hiring_status:
        | "new"
        | "interview_requested"
        | "interviewed"
        | "rejected"
        | "hired"
      invitation_status:
        | "draft"
        | "sent"
        | "opened"
        | "started"
        | "submitted"
        | "expired"
      org_role: "owner" | "admin"
      plan_tier: "trial" | "starter" | "growth" | "canceled"
      recommendation:
        | "strong_interview"
        | "interview"
        | "borderline"
        | "do_not_interview"
      test_type_key: "questionnaire" | "cashier_math" | "iq"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      billing_cycle: ["annual", "monthly"],
      hiring_status: [
        "new",
        "interview_requested",
        "interviewed",
        "rejected",
        "hired",
      ],
      invitation_status: [
        "draft",
        "sent",
        "opened",
        "started",
        "submitted",
        "expired",
      ],
      org_role: ["owner", "admin"],
      plan_tier: ["trial", "starter", "growth", "canceled"],
      recommendation: [
        "strong_interview",
        "interview",
        "borderline",
        "do_not_interview",
      ],
      test_type_key: ["questionnaire", "cashier_math", "iq"],
    },
  },
} as const
