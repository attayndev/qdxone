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
      applications: {
        Row: {
          availability: Json
          created_at: string
          custom_answers: Json
          decided_by: string | null
          decision: string | null
          decision_at: string | null
          decision_reason: string | null
          earliest_start_date: string | null
          eligible_to_work: boolean | null
          email: string
          entry_source: Database["public"]["Enums"]["application_entry_source"]
          first_name: string
          id: string
          job_posting_id: string | null
          job_references: Json
          last_name: string
          location_id: string
          org_id: string
          phone: string | null
          positions: string[]
          postal_code: string | null
          resume_token: string
          resume_url: string | null
          sms_consent: boolean
          sms_consent_at: string | null
          sms_consent_disclosure: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string
          updated_at: string
          work_history: Json
        }
        Insert: {
          availability?: Json
          created_at?: string
          custom_answers?: Json
          decided_by?: string | null
          decision?: string | null
          decision_at?: string | null
          decision_reason?: string | null
          earliest_start_date?: string | null
          eligible_to_work?: boolean | null
          email: string
          entry_source?: Database["public"]["Enums"]["application_entry_source"]
          first_name: string
          id?: string
          job_posting_id?: string | null
          job_references?: Json
          last_name: string
          location_id: string
          org_id: string
          phone?: string | null
          positions?: string[]
          postal_code?: string | null
          resume_token: string
          resume_url?: string | null
          sms_consent?: boolean
          sms_consent_at?: string | null
          sms_consent_disclosure?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          updated_at?: string
          work_history?: Json
        }
        Update: {
          availability?: Json
          created_at?: string
          custom_answers?: Json
          decided_by?: string | null
          decision?: string | null
          decision_at?: string | null
          decision_reason?: string | null
          earliest_start_date?: string | null
          eligible_to_work?: boolean | null
          email?: string
          entry_source?: Database["public"]["Enums"]["application_entry_source"]
          first_name?: string
          id?: string
          job_posting_id?: string | null
          job_references?: Json
          last_name?: string
          location_id?: string
          org_id?: string
          phone?: string | null
          positions?: string[]
          postal_code?: string | null
          resume_token?: string
          resume_url?: string | null
          sms_consent?: boolean
          sms_consent_at?: string | null
          sms_consent_disclosure?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          updated_at?: string
          work_history?: Json
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_responses: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_kind: Database["public"]["Enums"]["assessment_item_kind"]
          response_ms: number | null
          sequence: number | null
          session_id: string
          value_int: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_kind?: Database["public"]["Enums"]["assessment_item_kind"]
          response_ms?: number | null
          sequence?: number | null
          session_id: string
          value_int?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_kind?: Database["public"]["Enums"]["assessment_item_kind"]
          response_ms?: number | null
          sequence?: number | null
          session_id?: string
          value_int?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sessions: {
        Row: {
          access_token: string
          application_id: string | null
          completed_at: string | null
          created_at: string
          delivery_channels: string[]
          expires_at: string | null
          form_item_ids: string[]
          id: string
          location_id: string | null
          methodology_version: string
          org_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          subject_type: Database["public"]["Enums"]["assessment_subject_type"]
          updated_at: string
        }
        Insert: {
          access_token: string
          application_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_channels?: string[]
          expires_at?: string | null
          form_item_ids?: string[]
          id?: string
          location_id?: string | null
          methodology_version: string
          org_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          subject_type?: Database["public"]["Enums"]["assessment_subject_type"]
          updated_at?: string
        }
        Update: {
          access_token?: string
          application_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_channels?: string[]
          expires_at?: string | null
          form_item_ids?: string[]
          id?: string
          location_id?: string | null
          methodology_version?: string
          org_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          subject_type?: Database["public"]["Enums"]["assessment_subject_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_sessions_methodology_version_fkey"
            columns: ["methodology_version"]
            isOneToOne: false
            referencedRelation: "methodology_versions"
            referencedColumns: ["version"]
          },
          {
            foreignKeyName: "assessment_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_taxonomy: {
        Row: {
          category_academic: string
          category_ui: string
          definition: string | null
          facet: string
          item_count: number | null
          outcomes_predicted: string | null
          sort_order: number
          version: string
          why_it_matters: string | null
        }
        Insert: {
          category_academic: string
          category_ui: string
          definition?: string | null
          facet: string
          item_count?: number | null
          outcomes_predicted?: string | null
          sort_order?: number
          version: string
          why_it_matters?: string | null
        }
        Update: {
          category_academic?: string
          category_ui?: string
          definition?: string | null
          facet?: string
          item_count?: number | null
          outcomes_predicted?: string | null
          sort_order?: number
          version?: string
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_taxonomy_version_fkey"
            columns: ["version"]
            isOneToOne: false
            referencedRelation: "methodology_versions"
            referencedColumns: ["version"]
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
            foreignKeyName: "audit_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          id: string
          meta: Json
          org_id: string | null
          reason_code: string | null
          subject_id: string | null
          subject_type: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          org_id?: string | null
          reason_code?: string | null
          subject_id?: string | null
          subject_type?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          org_id?: string | null
          reason_code?: string | null
          subject_id?: string | null
          subject_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_overrides: {
        Row: {
          date: string
          end_time: string | null
          id: string
          is_unavailable: boolean
          org_id: string
          reason: string | null
          start_time: string | null
          user_id: string
        }
        Insert: {
          date: string
          end_time?: string | null
          id?: string
          is_unavailable?: boolean
          org_id: string
          reason?: string | null
          start_time?: string | null
          user_id: string
        }
        Update: {
          date?: string
          end_time?: string | null
          id?: string
          is_unavailable?: boolean
          org_id?: string
          reason?: string | null
          start_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_overrides_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          org_id: string
          start_time: string
          template_id: string | null
          timezone: string
          user_id: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          org_id: string
          start_time: string
          template_id?: string | null
          timezone: string
          user_id: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          org_id?: string
          start_time?: string
          template_id?: string | null
          timezone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "interview_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          availability_calendar_id: string | null
          booking_calendar_id: string | null
          created_at: string
          enc_access_token: string | null
          enc_key_version: number
          enc_refresh_token: string | null
          external_account_id: string | null
          id: string
          last_sync_at: string | null
          org_id: string
          provider: string
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability_calendar_id?: string | null
          booking_calendar_id?: string | null
          created_at?: string
          enc_access_token?: string | null
          enc_key_version?: number
          enc_refresh_token?: string | null
          external_account_id?: string | null
          id?: string
          last_sync_at?: string | null
          org_id: string
          provider: string
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability_calendar_id?: string | null
          booking_calendar_id?: string | null
          created_at?: string
          enc_access_token?: string | null
          enc_key_version?: number
          enc_refresh_token?: string | null
          external_account_id?: string | null
          id?: string
          last_sync_at?: string | null
          org_id?: string
          provider?: string
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_bookings: {
        Row: {
          application_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          conference_url: string | null
          created_at: string
          end_at: string
          external_calendar_event_id: string | null
          external_calendar_provider: string | null
          id: string
          idempotency_key: string | null
          interviewer_id: string
          invitation_id: string | null
          meeting_location: string | null
          meeting_type: string | null
          org_id: string
          original_booking_id: string | null
          start_at: string
          status: string
          template_id: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          application_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          conference_url?: string | null
          created_at?: string
          end_at: string
          external_calendar_event_id?: string | null
          external_calendar_provider?: string | null
          id?: string
          idempotency_key?: string | null
          interviewer_id: string
          invitation_id?: string | null
          meeting_location?: string | null
          meeting_type?: string | null
          org_id: string
          original_booking_id?: string | null
          start_at: string
          status?: string
          template_id?: string | null
          timezone: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          conference_url?: string | null
          created_at?: string
          end_at?: string
          external_calendar_event_id?: string | null
          external_calendar_provider?: string | null
          id?: string
          idempotency_key?: string | null
          interviewer_id?: string
          invitation_id?: string | null
          meeting_location?: string | null
          meeting_type?: string | null
          org_id?: string
          original_booking_id?: string | null
          start_at?: string
          status?: string
          template_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_bookings_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_bookings_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "scheduling_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_bookings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_bookings_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "interview_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_bookings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "interview_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_template_interviewers: {
        Row: {
          id: string
          is_active: boolean
          priority: number
          template_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          priority?: number
          template_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          priority?: number
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_template_interviewers_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "interview_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_templates: {
        Row: {
          assignment_type: string
          buffer_after_minutes: number
          buffer_before_minutes: number
          candidate_instructions: string | null
          created_at: string
          duration_minutes: number
          id: string
          interviewer_instructions: string | null
          is_active: boolean
          job_posting_id: string | null
          location_id: string | null
          max_advance_days: number
          meeting_location: string | null
          meeting_type: string
          min_notice_minutes: number
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          assignment_type?: string
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          candidate_instructions?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          interviewer_instructions?: string | null
          is_active?: boolean
          job_posting_id?: string | null
          location_id?: string | null
          max_advance_days?: number
          meeting_location?: string | null
          meeting_type?: string
          min_notice_minutes?: number
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          assignment_type?: string
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          candidate_instructions?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          interviewer_instructions?: string | null
          is_active?: boolean
          job_posting_id?: string | null
          location_id?: string | null
          max_advance_days?: number
          meeting_location?: string | null
          meeting_type?: string
          min_notice_minutes?: number
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_templates_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_templates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      item_bank_items: {
        Row: {
          category_academic: string
          category_ui: string
          facet: string
          item_id: string
          item_kind: Database["public"]["Enums"]["assessment_item_kind"]
          item_text: string
          keying: string
          notes: string | null
          sort_order: number
          version: string
        }
        Insert: {
          category_academic: string
          category_ui: string
          facet: string
          item_id: string
          item_kind?: Database["public"]["Enums"]["assessment_item_kind"]
          item_text: string
          keying: string
          notes?: string | null
          sort_order?: number
          version: string
        }
        Update: {
          category_academic?: string
          category_ui?: string
          facet?: string
          item_id?: string
          item_kind?: Database["public"]["Enums"]["assessment_item_kind"]
          item_text?: string
          keying?: string
          notes?: string | null
          sort_order?: number
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_bank_items_version_fkey"
            columns: ["version"]
            isOneToOne: false
            referencedRelation: "methodology_versions"
            referencedColumns: ["version"]
          },
        ]
      }
      job_postings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          location_id: string | null
          org_id: string
          public_token: string
          role_type: Database["public"]["Enums"]["location_role_type"]
          status: Database["public"]["Enums"]["job_posting_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string | null
          org_id: string
          public_token: string
          role_type?: Database["public"]["Enums"]["location_role_type"]
          status?: Database["public"]["Enums"]["job_posting_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string | null
          org_id?: string
          public_token?: string
          role_type?: Database["public"]["Enums"]["location_role_type"]
          status?: Database["public"]["Enums"]["job_posting_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          id: string
          name: string
          org_id: string
          postal_code: string | null
          region: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name: string
          org_id: string
          postal_code?: string | null
          region?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          postal_code?: string | null
          region?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      methodology_versions: {
        Row: {
          created_at: string
          io_psych_signoff_at: string | null
          label: string
          notes: string | null
          status: Database["public"]["Enums"]["methodology_status"]
          version: string
        }
        Insert: {
          created_at?: string
          io_psych_signoff_at?: string | null
          label: string
          notes?: string | null
          status?: Database["public"]["Enums"]["methodology_status"]
          version: string
        }
        Update: {
          created_at?: string
          io_psych_signoff_at?: string | null
          label?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["methodology_status"]
          version?: string
        }
        Relationships: []
      }
      org_members: {
        Row: {
          created_at: string
          notify_prefs: Json
          org_id: string
          phone: string | null
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          notify_prefs?: Json
          org_id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          notify_prefs?: Json
          org_id?: string
          phone?: string | null
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
      organizations: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"] | null
          branding: Json
          created_at: string
          id: string
          location_count: number
          name: string
          plan: string
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
          location_count?: number
          name: string
          plan?: string
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
          location_count?: number
          name?: string
          plan?: string
          slug?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scheduling_invitations: {
        Row: {
          application_id: string
          assigned_interviewer_id: string | null
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          job_posting_id: string | null
          max_bookings: number
          org_id: string
          revoked_at: string | null
          status: string
          template_id: string
          token_hash: string
        }
        Insert: {
          application_id: string
          assigned_interviewer_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          job_posting_id?: string | null
          max_bookings?: number
          org_id: string
          revoked_at?: string | null
          status?: string
          template_id: string
          token_hash: string
        }
        Update: {
          application_id?: string
          assigned_interviewer_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          job_posting_id?: string | null
          max_bookings?: number
          org_id?: string
          revoked_at?: string | null
          status?: string
          template_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduling_invitations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduling_invitations_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduling_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduling_invitations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "interview_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduling_jobs: {
        Row: {
          attempts: number
          booking_id: string | null
          created_at: string
          id: string
          kind: string
          last_error: string | null
          org_id: string
          payload: Json
          run_after: string
          status: string
        }
        Insert: {
          attempts?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          kind: string
          last_error?: string | null
          org_id: string
          payload?: Json
          run_after?: string
          status?: string
        }
        Update: {
          attempts?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          org_id?: string
          payload?: Json
          run_after?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduling_jobs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "interview_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduling_jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_config: {
        Row: {
          config: Json
          created_at: string
          version: string
        }
        Insert: {
          config: Json
          created_at?: string
          version: string
        }
        Update: {
          config?: Json
          created_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_config_version_fkey"
            columns: ["version"]
            isOneToOne: true
            referencedRelation: "methodology_versions"
            referencedColumns: ["version"]
          },
        ]
      }
      screener_items: {
        Row: {
          format: string
          item_id: string
          options: Json | null
          question: string
          scoring_note: string | null
          sort_order: number
          version: string
        }
        Insert: {
          format: string
          item_id: string
          options?: Json | null
          question: string
          scoring_note?: string | null
          sort_order?: number
          version: string
        }
        Update: {
          format?: string
          item_id?: string
          options?: Json | null
          question?: string
          scoring_note?: string | null
          sort_order?: number
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "screener_items_version_fkey"
            columns: ["version"]
            isOneToOne: false
            referencedRelation: "methodology_versions"
            referencedColumns: ["version"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_org_member: { Args: { p_org: string }; Returns: boolean }
      is_org_owner: { Args: { p_org: string }; Returns: boolean }
    }
    Enums: {
      application_entry_source: "job_posting" | "standalone"
      application_status:
        | "new"
        | "assessment_sent"
        | "assessment_complete"
        | "decision_made"
      assessment_item_kind: "personality" | "screener" | "attention_check"
      assessment_status: "sent" | "in_progress" | "complete" | "expired"
      assessment_subject_type: "candidate" | "incumbent"
      billing_cycle: "annual" | "monthly"
      job_posting_status: "draft" | "open" | "closed"
      location_role_type: "crew" | "shift_lead" | "gm"
      methodology_status: "draft" | "active" | "retired"
      org_role: "owner" | "admin"
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
      application_entry_source: ["job_posting", "standalone"],
      application_status: [
        "new",
        "assessment_sent",
        "assessment_complete",
        "decision_made",
      ],
      assessment_item_kind: ["personality", "screener", "attention_check"],
      assessment_status: ["sent", "in_progress", "complete", "expired"],
      assessment_subject_type: ["candidate", "incumbent"],
      billing_cycle: ["annual", "monthly"],
      job_posting_status: ["draft", "open", "closed"],
      location_role_type: ["crew", "shift_lead", "gm"],
      methodology_status: ["draft", "active", "retired"],
      org_role: ["owner", "admin"],
    },
  },
} as const
