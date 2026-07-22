export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      absence_requests: {
        Row: {
          absence_date: string
          academic_year_id: string
          class_id: string
          created_at: string
          created_by: string
          id: string
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          staff_note: string | null
          status: Database["public"]["Enums"]["absence_request_status"]
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          absence_date: string
          academic_year_id: string
          class_id: string
          created_at?: string
          created_by: string
          id?: string
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_note?: string | null
          status?: Database["public"]["Enums"]["absence_request_status"]
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          absence_date?: string
          academic_year_id?: string
          class_id?: string
          created_at?: string
          created_by?: string
          id?: string
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_note?: string | null
          status?: Database["public"]["Enums"]["absence_request_status"]
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "absence_requests_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_requests_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "absence_requests_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "absence_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_celebrations"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "absence_requests_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_years: {
        Row: {
          attendance_edit_lease_minutes: number
          attendance_lock_days: number
          attendance_warning_consecutive_absences: number
          attendance_warning_consecutive_sundays: number
          attendance_warning_rate_threshold: number
          code: string
          created_at: string
          end_date: string
          id: string
          name: string
          retention_until: string
          start_date: string
          status: Database["public"]["Enums"]["academic_year_status"]
          top5_enabled: boolean
          trainee_can_comment: boolean
          trainee_can_grade: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          attendance_edit_lease_minutes?: number
          attendance_lock_days?: number
          attendance_warning_consecutive_absences?: number
          attendance_warning_consecutive_sundays?: number
          attendance_warning_rate_threshold?: number
          code: string
          created_at?: string
          end_date: string
          id?: string
          name: string
          retention_until: string
          start_date: string
          status?: Database["public"]["Enums"]["academic_year_status"]
          top5_enabled?: boolean
          trainee_can_comment?: boolean
          trainee_can_grade?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          attendance_edit_lease_minutes?: number
          attendance_lock_days?: number
          attendance_warning_consecutive_absences?: number
          attendance_warning_consecutive_sundays?: number
          attendance_warning_rate_threshold?: number
          code?: string
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          retention_until?: string
          start_date?: string
          status?: Database["public"]["Enums"]["academic_year_status"]
          top5_enabled?: boolean
          trainee_can_comment?: boolean
          trainee_can_grade?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_scores: {
        Row: {
          academic_year_id: string
          assessment_id: string
          assessment_published: boolean
          class_id: string
          created_at: string
          enrollment_id: string
          graded_at: string | null
          graded_by: string | null
          id: string
          is_manual_override: boolean
          note: string | null
          score: number | null
          student_id: string
          system_suggested_score: number | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          assessment_id: string
          assessment_published?: boolean
          class_id: string
          created_at?: string
          enrollment_id: string
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_manual_override?: boolean
          note?: string | null
          score?: number | null
          student_id: string
          system_suggested_score?: number | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          assessment_id?: string
          assessment_published?: boolean
          class_id?: string
          created_at?: string
          enrollment_id?: string
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_manual_override?: boolean
          note?: string | null
          score?: number | null
          student_id?: string
          system_suggested_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_scores_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "assessment_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "assessment_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_celebrations"
            referencedColumns: ["student_id"]
          },
        ]
      }
      assessment_type_settings: {
        Row: {
          academic_year_id: string
          created_at: string
          default_weight: number
          display_name: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["assessment_kind"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          default_weight: number
          display_name: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["assessment_kind"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          default_weight?: number
          display_name?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["assessment_kind"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_type_settings_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_type_settings_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "assessment_type_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          academic_year_id: string
          assessment_date: string | null
          attendance_component:
            | Database["public"]["Enums"]["attendance_score_component"]
            | null
          class_id: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          is_published: boolean
          kind: Database["public"]["Enums"]["assessment_kind"]
          max_score: number
          title: string
          updated_at: string
          updated_by: string | null
          weight: number
        }
        Insert: {
          academic_year_id: string
          assessment_date?: string | null
          attendance_component?:
            | Database["public"]["Enums"]["attendance_score_component"]
            | null
          class_id: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          is_published?: boolean
          kind: Database["public"]["Enums"]["assessment_kind"]
          max_score?: number
          title: string
          updated_at?: string
          updated_by?: string | null
          weight: number
        }
        Update: {
          academic_year_id?: string
          assessment_date?: string | null
          attendance_component?:
            | Database["public"]["Enums"]["attendance_score_component"]
            | null
          class_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          is_published?: boolean
          kind?: Database["public"]["Enums"]["assessment_kind"]
          max_score?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          academic_year_id: string
          attendance_date: string
          class_id: string
          created_at: string
          editing_by: string | null
          editing_started_at: string | null
          finalized_at: string | null
          finalized_by: string | null
          id: string
          last_activity_at: string | null
          locked_at: string | null
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          status: Database["public"]["Enums"]["attendance_session_status"]
          unlocked_at: string | null
          unlocked_by: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_year_id: string
          attendance_date: string
          class_id: string
          created_at?: string
          editing_by?: string | null
          editing_started_at?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          last_activity_at?: string | null
          locked_at?: string | null
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          status?: Database["public"]["Enums"]["attendance_session_status"]
          unlocked_at?: string | null
          unlocked_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_year_id?: string
          attendance_date?: string
          class_id?: string
          created_at?: string
          editing_by?: string | null
          editing_started_at?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          last_activity_at?: string | null
          locked_at?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          status?: Database["public"]["Enums"]["attendance_session_status"]
          unlocked_at?: string | null
          unlocked_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "attendance_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_editing_by_fkey"
            columns: ["editing_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_unlocked_by_fkey"
            columns: ["unlocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_weight_settings: {
        Row: {
          academic_year_id: string
          created_at: string
          updated_at: string
          updated_by: string | null
          weight_excused_absence: number
          weight_late: number
          weight_left_early: number
          weight_present: number
          weight_unexcused_absence: number
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          weight_excused_absence?: number
          weight_late?: number
          weight_left_early?: number
          weight_present?: number
          weight_unexcused_absence?: number
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          updated_at?: string
          updated_by?: string | null
          weight_excused_absence?: number
          weight_late?: number
          weight_left_early?: number
          weight_present?: number
          weight_unexcused_absence?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_weight_settings_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: true
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_weight_settings_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: true
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "attendance_weight_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_staff_assignments: {
        Row: {
          capacity: Database["public"]["Enums"]["class_staff_capacity"]
          class_id: string
          created_at: string
          ends_on: string | null
          id: string
          is_active: boolean
          staff_profile_id: string
          starts_on: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          capacity: Database["public"]["Enums"]["class_staff_capacity"]
          class_id: string
          created_at?: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          staff_profile_id: string
          starts_on: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          capacity?: Database["public"]["Enums"]["class_staff_capacity"]
          class_id?: string
          created_at?: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          staff_profile_id?: string
          starts_on?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_staff_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_staff_assignments_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_staff_assignments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_templates: {
        Row: {
          class_kind: Database["public"]["Enums"]["class_kind"]
          created_at: string
          display_name: string
          grade_level_id: string | null
          id: string
          is_active: boolean
          section_code: string | null
          sort_order: number
          term_scope: Database["public"]["Enums"]["term_scope"]
          updated_at: string
        }
        Insert: {
          class_kind?: Database["public"]["Enums"]["class_kind"]
          created_at?: string
          display_name: string
          grade_level_id?: string | null
          id?: string
          is_active?: boolean
          section_code?: string | null
          sort_order: number
          term_scope?: Database["public"]["Enums"]["term_scope"]
          updated_at?: string
        }
        Update: {
          class_kind?: Database["public"]["Enums"]["class_kind"]
          created_at?: string
          display_name?: string
          grade_level_id?: string | null
          id?: string
          is_active?: boolean
          section_code?: string | null
          sort_order?: number
          term_scope?: Database["public"]["Enums"]["term_scope"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_templates_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year_id: string
          class_kind: Database["public"]["Enums"]["class_kind"]
          created_at: string
          display_name: string
          grade_level_id: string | null
          id: string
          meeting_location: string | null
          notes: string | null
          section_code: string | null
          status: Database["public"]["Enums"]["class_status"]
          term_scope: Database["public"]["Enums"]["term_scope"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_year_id: string
          class_kind?: Database["public"]["Enums"]["class_kind"]
          created_at?: string
          display_name: string
          grade_level_id?: string | null
          id?: string
          meeting_location?: string | null
          notes?: string | null
          section_code?: string | null
          status?: Database["public"]["Enums"]["class_status"]
          term_scope?: Database["public"]["Enums"]["term_scope"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_year_id?: string
          class_kind?: Database["public"]["Enums"]["class_kind"]
          created_at?: string
          display_name?: string
          grade_level_id?: string | null
          id?: string
          meeting_location?: string | null
          notes?: string | null
          section_code?: string | null
          status?: Database["public"]["Enums"]["class_status"]
          term_scope?: Database["public"]["Enums"]["term_scope"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "classes_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_announcements: {
        Row: {
          author_staff_id: string | null
          committee_id: string
          content: string
          created_at: string
          created_by: string
          id: string
          published_at: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_staff_id?: string | null
          committee_id: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          published_at?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_staff_id?: string | null
          committee_id?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          published_at?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_announcements_author_staff_id_fkey"
            columns: ["author_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_announcements_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_announcements_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_meetings: {
        Row: {
          committee_id: string
          created_at: string
          created_by: string
          ends_at: string | null
          id: string
          location: string | null
          note: string | null
          starts_at: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          committee_id: string
          created_at?: string
          created_by: string
          ends_at?: string | null
          id?: string
          location?: string | null
          note?: string | null
          starts_at: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          committee_id?: string
          created_at?: string
          created_by?: string
          ends_at?: string | null
          id?: string
          location?: string | null
          note?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_meetings_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_meetings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_memberships: {
        Row: {
          committee_id: string
          created_at: string
          ends_on: string | null
          id: string
          is_active: boolean
          note: string | null
          position: Database["public"]["Enums"]["committee_position"]
          staff_profile_id: string
          starts_on: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          committee_id: string
          created_at?: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          note?: string | null
          position?: Database["public"]["Enums"]["committee_position"]
          staff_profile_id: string
          starts_on?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          committee_id?: string
          created_at?: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          note?: string | null
          position?: Database["public"]["Enums"]["committee_position"]
          staff_profile_id?: string
          starts_on?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_memberships_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_memberships_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_memberships_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_weekly_plans: {
        Row: {
          checklist_json: Json
          committee_id: string
          content: string | null
          created_at: string
          created_by: string
          id: string
          updated_at: string
          updated_by: string | null
          week_start: string
        }
        Insert: {
          checklist_json?: Json
          committee_id: string
          content?: string | null
          created_at?: string
          created_by: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          week_start: string
        }
        Update: {
          checklist_json?: Json
          committee_id?: string
          content?: string | null
          created_at?: string
          created_by?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "committee_weekly_plans_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_weekly_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_weekly_plans_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      committees: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          manages_equipment: boolean
          name: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          manages_equipment?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          manages_equipment?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committees_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          ended_on: string | null
          enrolled_on: string
          id: string
          notes: string | null
          previous_enrollment_id: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          ended_on?: string | null
          enrolled_on?: string
          id?: string
          notes?: string | null
          previous_enrollment_id?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          ended_on?: string | null
          enrolled_on?: string
          id?: string
          notes?: string | null
          previous_enrollment_id?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_previous_enrollment_id_fkey"
            columns: ["previous_enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_celebrations"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_items: {
        Row: {
          asset_code: string
          available_quantity: number
          category: string | null
          committee_id: string
          condition: Database["public"]["Enums"]["equipment_condition"]
          created_at: string
          id: string
          is_active: boolean
          name: string
          note: string | null
          storage_location: string | null
          total_quantity: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          asset_code: string
          available_quantity: number
          category?: string | null
          committee_id: string
          condition?: Database["public"]["Enums"]["equipment_condition"]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          note?: string | null
          storage_location?: string | null
          total_quantity: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          asset_code?: string
          available_quantity?: number
          category?: string | null
          committee_id?: string
          condition?: Database["public"]["Enums"]["equipment_condition"]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          note?: string | null
          storage_location?: string | null
          total_quantity?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_items_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_loans: {
        Row: {
          borrow_note: string | null
          borrowed_at: string
          borrower_staff_id: string
          committee_id: string
          condition_on_return:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          created_at: string
          equipment_item_id: string
          expected_return_at: string | null
          handed_over_by: string
          id: string
          quantity: number
          received_by: string | null
          restored_quantity: number | null
          return_note: string | null
          returned_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          borrow_note?: string | null
          borrowed_at?: string
          borrower_staff_id: string
          committee_id: string
          condition_on_return?:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          created_at?: string
          equipment_item_id: string
          expected_return_at?: string | null
          handed_over_by: string
          id?: string
          quantity: number
          received_by?: string | null
          restored_quantity?: number | null
          return_note?: string | null
          returned_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          borrow_note?: string | null
          borrowed_at?: string
          borrower_staff_id?: string
          committee_id?: string
          condition_on_return?:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          created_at?: string
          equipment_item_id?: string
          expected_return_at?: string | null
          handed_over_by?: string
          id?: string
          quantity?: number
          received_by?: string | null
          restored_quantity?: number | null
          return_note?: string | null
          returned_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_loans_borrower_staff_id_fkey"
            columns: ["borrower_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_loans_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_loans_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_loans_handed_over_by_fkey"
            columns: ["handed_over_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_loans_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_levels: {
        Row: {
          allows_sections: boolean
          can_propose_trainee: boolean
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          is_sector_final_level: boolean
          level_number: number
          next_grade_level_id: string | null
          requires_sacrament_review: boolean
          sector_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          allows_sections?: boolean
          can_propose_trainee?: boolean
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          is_sector_final_level?: boolean
          level_number: number
          next_grade_level_id?: string | null
          requires_sacrament_review?: boolean
          sector_id: string
          sort_order: number
          updated_at?: string
        }
        Update: {
          allows_sections?: boolean
          can_propose_trainee?: boolean
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          is_sector_final_level?: boolean
          level_number?: number
          next_grade_level_id?: string | null
          requires_sacrament_review?: boolean
          sector_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_levels_next_grade_level_id_fkey"
            columns: ["next_grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_levels_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      gradebook_locks: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          is_locked: boolean
          locked_at: string | null
          locked_by: string | null
          results_published_at: string | null
          results_published_by: string | null
          unlocked_at: string | null
          unlocked_by: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          results_published_at?: string | null
          results_published_by?: string | null
          unlocked_at?: string | null
          unlocked_by?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          results_published_at?: string | null
          results_published_by?: string | null
          unlocked_at?: string | null
          unlocked_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gradebook_locks_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gradebook_locks_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "gradebook_locks_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: true
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gradebook_locks_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gradebook_locks_results_published_by_fkey"
            columns: ["results_published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gradebook_locks_unlocked_by_fkey"
            columns: ["unlocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          address: string | null
          created_at: string
          full_name: string
          id: string
          phone: string
          profile_id: string | null
          status: Database["public"]["Enums"]["guardian_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone: string
          profile_id?: string | null
          status?: Database["public"]["Enums"]["guardian_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          profile_id?: string | null
          status?: Database["public"]["Enums"]["guardian_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardians_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          academic_year_id: string
          committed_at: string | null
          committed_rows: number
          created_at: string
          error_rows: number
          filename: string
          id: string
          source_format: string
          status: Database["public"]["Enums"]["import_batch_status"]
          total_rows: number
          updated_at: string
          uploaded_by: string | null
          valid_rows: number
          warning_rows: number
        }
        Insert: {
          academic_year_id: string
          committed_at?: string | null
          committed_rows?: number
          created_at?: string
          error_rows?: number
          filename: string
          id?: string
          source_format?: string
          status?: Database["public"]["Enums"]["import_batch_status"]
          total_rows?: number
          updated_at?: string
          uploaded_by?: string | null
          valid_rows?: number
          warning_rows?: number
        }
        Update: {
          academic_year_id?: string
          committed_at?: string | null
          committed_rows?: number
          created_at?: string
          error_rows?: number
          filename?: string
          id?: string
          source_format?: string
          status?: Database["public"]["Enums"]["import_batch_status"]
          total_rows?: number
          updated_at?: string
          uploaded_by?: string | null
          valid_rows?: number
          warning_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "import_batches_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_rows: {
        Row: {
          action: Database["public"]["Enums"]["import_row_action"]
          batch_id: string
          commit_error: string | null
          created_at: string
          created_guardian_id: string | null
          created_student_id: string | null
          errors_json: Json
          id: string
          matched_student_id: string | null
          normalized_json: Json | null
          raw_json: Json
          row_number: number
          status: Database["public"]["Enums"]["import_row_status"]
          updated_at: string
          warnings_json: Json
        }
        Insert: {
          action?: Database["public"]["Enums"]["import_row_action"]
          batch_id: string
          commit_error?: string | null
          created_at?: string
          created_guardian_id?: string | null
          created_student_id?: string | null
          errors_json?: Json
          id?: string
          matched_student_id?: string | null
          normalized_json?: Json | null
          raw_json: Json
          row_number: number
          status?: Database["public"]["Enums"]["import_row_status"]
          updated_at?: string
          warnings_json?: Json
        }
        Update: {
          action?: Database["public"]["Enums"]["import_row_action"]
          batch_id?: string
          commit_error?: string | null
          created_at?: string
          created_guardian_id?: string | null
          created_student_id?: string | null
          errors_json?: Json
          id?: string
          matched_student_id?: string | null
          normalized_json?: Json | null
          raw_json?: Json
          row_number?: number
          status?: Database["public"]["Enums"]["import_row_status"]
          updated_at?: string
          warnings_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "import_rows_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_created_guardian_id_fkey"
            columns: ["created_guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_created_student_id_fkey"
            columns: ["created_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_created_student_id_fkey"
            columns: ["created_student_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "import_rows_created_student_id_fkey"
            columns: ["created_student_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_celebrations"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "import_rows_matched_student_id_fkey"
            columns: ["matched_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_matched_student_id_fkey"
            columns: ["matched_student_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "import_rows_matched_student_id_fkey"
            columns: ["matched_student_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_celebrations"
            referencedColumns: ["student_id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          enrollment_id: string
          full_name_snapshot: string
          id: string
          leaderboard_id: string
          leaderboard_published: boolean
          rank: number
          saint_name_snapshot: string
          score: number | null
          title: string | null
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          enrollment_id: string
          full_name_snapshot: string
          id?: string
          leaderboard_id: string
          leaderboard_published?: boolean
          rank: number
          saint_name_snapshot: string
          score?: number | null
          title?: string | null
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          enrollment_id?: string
          full_name_snapshot?: string
          id?: string
          leaderboard_id?: string
          leaderboard_published?: boolean
          rank?: number
          saint_name_snapshot?: string
          score?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_entries_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "leaderboard_entries_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_entries_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_entries_leaderboard_id_fkey"
            columns: ["leaderboard_id"]
            isOneToOne: false
            referencedRelation: "leaderboards"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboards: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          created_by: string
          id: string
          is_published: boolean
          published_at: string | null
          published_by: string | null
          source_assessment_id: string | null
          source_type: Database["public"]["Enums"]["leaderboard_source_type"]
          title: string
          top_n: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          created_by: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          published_by?: string | null
          source_assessment_id?: string | null
          source_type: Database["public"]["Enums"]["leaderboard_source_type"]
          title: string
          top_n?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          published_by?: string | null
          source_assessment_id?: string | null
          source_type?: Database["public"]["Enums"]["leaderboard_source_type"]
          title?: string
          top_n?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboards_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboards_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "leaderboards_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboards_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboards_source_assessment_id_fkey"
            columns: ["source_assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboards_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_recipients: {
        Row: {
          delivered_at: string
          id: string
          notification_id: string
          profile_id: string
          read_at: string | null
        }
        Insert: {
          delivered_at?: string
          id?: string
          notification_id: string
          profile_id: string
          read_at?: string | null
        }
        Update: {
          delivered_at?: string
          id?: string
          notification_id?: string
          profile_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_recipients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          author_profile_id: string
          content: string
          created_at: string
          id: string
          link_path: string | null
          published_at: string
          recipient_count: number
          target_class_id: string | null
          target_committee_id: string | null
          target_profile_id: string | null
          target_sector_id: string | null
          target_type: Database["public"]["Enums"]["notification_target_type"]
          title: string
        }
        Insert: {
          author_profile_id: string
          content: string
          created_at?: string
          id?: string
          link_path?: string | null
          published_at?: string
          recipient_count?: number
          target_class_id?: string | null
          target_committee_id?: string | null
          target_profile_id?: string | null
          target_sector_id?: string | null
          target_type: Database["public"]["Enums"]["notification_target_type"]
          title: string
        }
        Update: {
          author_profile_id?: string
          content?: string
          created_at?: string
          id?: string
          link_path?: string | null
          published_at?: string
          recipient_count?: number
          target_class_id?: string | null
          target_committee_id?: string | null
          target_profile_id?: string | null
          target_sector_id?: string | null
          target_type?: Database["public"]["Enums"]["notification_target_type"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_class_id_fkey"
            columns: ["target_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_committee_id_fkey"
            columns: ["target_committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_sector_id_fkey"
            columns: ["target_sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          created_at: string
          display_name: string
          email: string | null
          id: string
          last_login_at: string | null
          must_change_password: boolean
          phone: string | null
          saint_name: string | null
          updated_at: string
          updated_by: string | null
          username: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          display_name: string
          email?: string | null
          id: string
          last_login_at?: string | null
          must_change_password?: boolean
          phone?: string | null
          saint_name?: string | null
          updated_at?: string
          updated_by?: string | null
          username: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          last_login_at?: string | null
          must_change_password?: boolean
          phone?: string | null
          saint_name?: string | null
          updated_at?: string
          updated_by?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_reviews: {
        Row: {
          approved_target_class_id: string | null
          created_at: string
          created_enrollment_id: string | null
          final_status: Database["public"]["Enums"]["promotion_status"]
          id: string
          propose_trainee: boolean
          proposed_at: string
          proposed_by: string
          proposed_status: Database["public"]["Enums"]["promotion_status"]
          proposed_target_class_id: string | null
          representative_note: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_academic_year_id: string
          source_class_id: string
          source_enrollment_id: string
          student_id: string
          updated_at: string
          warning_snapshot: Json
        }
        Insert: {
          approved_target_class_id?: string | null
          created_at?: string
          created_enrollment_id?: string | null
          final_status?: Database["public"]["Enums"]["promotion_status"]
          id?: string
          propose_trainee?: boolean
          proposed_at?: string
          proposed_by: string
          proposed_status: Database["public"]["Enums"]["promotion_status"]
          proposed_target_class_id?: string | null
          representative_note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_academic_year_id: string
          source_class_id: string
          source_enrollment_id: string
          student_id: string
          updated_at?: string
          warning_snapshot?: Json
        }
        Update: {
          approved_target_class_id?: string | null
          created_at?: string
          created_enrollment_id?: string | null
          final_status?: Database["public"]["Enums"]["promotion_status"]
          id?: string
          propose_trainee?: boolean
          proposed_at?: string
          proposed_by?: string
          proposed_status?: Database["public"]["Enums"]["promotion_status"]
          proposed_target_class_id?: string | null
          representative_note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_academic_year_id?: string
          source_class_id?: string
          source_enrollment_id?: string
          student_id?: string
          updated_at?: string
          warning_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "promotion_reviews_approved_target_class_id_fkey"
            columns: ["approved_target_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_reviews_created_enrollment_id_fkey"
            columns: ["created_enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_reviews_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_reviews_proposed_target_class_id_fkey"
            columns: ["proposed_target_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_reviews_source_academic_year_id_fkey"
            columns: ["source_academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_reviews_source_academic_year_id_fkey"
            columns: ["source_academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "promotion_reviews_source_class_id_fkey"
            columns: ["source_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_reviews_source_enrollment_id_fkey"
            columns: ["source_enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "promotion_reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_celebrations"
            referencedColumns: ["student_id"]
          },
        ]
      }
      report_snapshots: {
        Row: {
          academic_year_id: string
          checksum: string
          file_path: string | null
          filter_json: Json
          generated_at: string
          generated_by: string
          id: string
          payload_json: Json
          period_end: string
          period_start: string
          period_type: string
          report_type: string
          scope_id: string | null
          scope_type: string
          status: string
          title: string
        }
        Insert: {
          academic_year_id: string
          checksum: string
          file_path?: string | null
          filter_json?: Json
          generated_at?: string
          generated_by: string
          id?: string
          payload_json: Json
          period_end: string
          period_start: string
          period_type: string
          report_type: string
          scope_id?: string | null
          scope_type: string
          status?: string
          title: string
        }
        Update: {
          academic_year_id?: string
          checksum?: string
          file_path?: string | null
          filter_json?: Json
          generated_at?: string
          generated_by?: string
          id?: string
          payload_json?: Json
          period_end?: string
          period_start?: string
          period_type?: string
          report_type?: string
          scope_id?: string | null
          scope_type?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_snapshots_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_snapshots_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "report_snapshots_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_assignments: {
        Row: {
          academic_year_id: string | null
          appointment_document_path: string | null
          class_id: string | null
          created_at: string
          ends_on: string | null
          id: string
          is_active: boolean
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
          sector_id: string | null
          starts_on: string
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          appointment_document_path?: string | null
          class_id?: string | null
          created_at?: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
          sector_id?: string | null
          starts_on?: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          appointment_document_path?: string | null
          class_id?: string | null
          created_at?: string
          ends_on?: string | null
          id?: string
          is_active?: boolean
          profile_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          sector_id?: string | null
          starts_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_assignments_academic_year_fk"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_academic_year_fk"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "role_assignments_class_fk"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_sector_fk"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          allows_sections: boolean
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          short_name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          allows_sections?: boolean
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          short_name: string
          sort_order: number
          updated_at?: string
        }
        Update: {
          allows_sections?: boolean
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          short_name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff_attendance_records: {
        Row: {
          attendance_session_id: string
          class_id: string
          class_staff_assignment_id: string
          created_at: string
          id: string
          note: string | null
          session_finalized_at: string | null
          staff_profile_id: string
          status: Database["public"]["Enums"]["staff_attendance_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          attendance_session_id: string
          class_id: string
          class_staff_assignment_id: string
          created_at?: string
          id?: string
          note?: string | null
          session_finalized_at?: string | null
          staff_profile_id: string
          status?: Database["public"]["Enums"]["staff_attendance_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          attendance_session_id?: string
          class_id?: string
          class_staff_assignment_id?: string
          created_at?: string
          id?: string
          note?: string | null
          session_finalized_at?: string | null
          staff_profile_id?: string
          status?: Database["public"]["Enums"]["staff_attendance_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_records_attendance_session_id_fkey"
            columns: ["attendance_session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_records_class_staff_assignment_id_fkey"
            columns: ["class_staff_assignment_id"]
            isOneToOne: false
            referencedRelation: "class_staff_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_records_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          address: string | null
          avatar_path: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          formation_level: Database["public"]["Enums"]["formation_level"]
          full_name: string
          id: string
          phone: string
          profile_id: string | null
          saint_name: string | null
          service_status: Database["public"]["Enums"]["staff_service_status"]
          staff_code: string
          title: Database["public"]["Enums"]["staff_title"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          avatar_path?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          formation_level?: Database["public"]["Enums"]["formation_level"]
          full_name: string
          id?: string
          phone: string
          profile_id?: string | null
          saint_name?: string | null
          service_status?: Database["public"]["Enums"]["staff_service_status"]
          staff_code?: string
          title: Database["public"]["Enums"]["staff_title"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          avatar_path?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          formation_level?: Database["public"]["Enums"]["formation_level"]
          full_name?: string
          id?: string
          phone?: string
          profile_id?: string | null
          saint_name?: string | null
          service_status?: Database["public"]["Enums"]["staff_service_status"]
          staff_code?: string
          title?: Database["public"]["Enums"]["staff_title"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_attendance_records: {
        Row: {
          attendance_session_id: string
          catechism_status: Database["public"]["Enums"]["attendance_status"]
          class_id: string
          created_at: string
          enrollment_id: string
          id: string
          mass_status: Database["public"]["Enums"]["attendance_status"]
          note: string | null
          session_finalized_at: string | null
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          attendance_session_id: string
          catechism_status?: Database["public"]["Enums"]["attendance_status"]
          class_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          mass_status?: Database["public"]["Enums"]["attendance_status"]
          note?: string | null
          session_finalized_at?: string | null
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          attendance_session_id?: string
          catechism_status?: Database["public"]["Enums"]["attendance_status"]
          class_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          mass_status?: Database["public"]["Enums"]["attendance_status"]
          note?: string | null
          session_finalized_at?: string | null
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_attendance_records_attendance_session_id_fkey"
            columns: ["attendance_session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_records_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_celebrations"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_attendance_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_comments: {
        Row: {
          academic_year_id: string
          author_profile_id: string
          class_id: string
          comment_date: string
          content: string
          created_at: string
          enrollment_id: string
          id: string
          student_id: string
          updated_at: string
          updated_by: string | null
          visibility: Database["public"]["Enums"]["comment_visibility"]
        }
        Insert: {
          academic_year_id: string
          author_profile_id: string
          class_id: string
          comment_date?: string
          content: string
          created_at?: string
          enrollment_id: string
          id?: string
          student_id: string
          updated_at?: string
          updated_by?: string | null
          visibility: Database["public"]["Enums"]["comment_visibility"]
        }
        Update: {
          academic_year_id?: string
          author_profile_id?: string
          class_id?: string
          comment_date?: string
          content?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          student_id?: string
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["comment_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "student_comments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_comments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "student_comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_comments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_comments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_comments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_comments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_comments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_celebrations"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_comments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_health_profiles: {
        Row: {
          allergies: string | null
          emergency_notes: string | null
          medical_conditions: string | null
          medications: string | null
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allergies?: string | null
          emergency_notes?: string | null
          medical_conditions?: string | null
          medications?: string | null
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allergies?: string | null
          emergency_notes?: string | null
          medical_conditions?: string | null
          medications?: string | null
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_health_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_health_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "v_incomplete_student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_health_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "v_upcoming_celebrations"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_health_profiles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_sacraments: {
        Row: {
          created_at: string
          godparent_name: string | null
          id: string
          notes: string | null
          place: string | null
          registry_number: string | null
          sacrament_date: string | null
          sacrament_name: string | null
          sacrament_type: Database["public"]["Enums"]["sacrament_type"]
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          godparent_name?: string | null
          id?: string
          notes?: string | null
          place?: string | null
          registry_number?: string | null
          sacrament_date?: string | null
          sacrament_name?: string | null
          sacrament_type: Database["public"]["Enums"]["sacrament_type"]
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          godparent_name?: string | null
          id?: string
          notes?: string | null
          place?: string | null
          registry_number?: string | null
          sacrament_date?: string | null
          sacrament_name?: string | null
          sacrament_type?: Database["public"]["Enums"]["sacrament_type"]
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_sacraments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_sacraments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_sacraments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_celebrations"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_sacraments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          general_notes: string | null
          guardian_id: string
          hardship_flag: boolean
          id: string
          normalized_full_name: string | null
          patron_feast_date: string | null
          phone: string | null
          profile_id: string | null
          saint_name: string
          status: Database["public"]["Enums"]["student_status"]
          student_code: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth: string
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          general_notes?: string | null
          guardian_id: string
          hardship_flag?: boolean
          id?: string
          normalized_full_name?: string | null
          patron_feast_date?: string | null
          phone?: string | null
          profile_id?: string | null
          saint_name: string
          status?: Database["public"]["Enums"]["student_status"]
          student_code?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          general_notes?: string | null
          guardian_id?: string
          hardship_flag?: boolean
          id?: string
          normalized_full_name?: string | null
          patron_feast_date?: string | null
          phone?: string | null
          profile_id?: string | null
          saint_name?: string
          status?: Database["public"]["Enums"]["student_status"]
          student_code?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_plan_items: {
        Row: {
          catechism_content: string | null
          created_at: string
          game: string | null
          homework: string | null
          id: string
          item_type: Database["public"]["Enums"]["teaching_plan_item_type"]
          material_mime_type: string | null
          material_name: string | null
          material_path: string | null
          material_size: number | null
          note: string | null
          objectives: string | null
          planned_date: string
          preparation: string | null
          scripture_content: string | null
          sequence_no: number
          song: string | null
          teacher_staff_id: string | null
          teaching_plan_id: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          catechism_content?: string | null
          created_at?: string
          game?: string | null
          homework?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["teaching_plan_item_type"]
          material_mime_type?: string | null
          material_name?: string | null
          material_path?: string | null
          material_size?: number | null
          note?: string | null
          objectives?: string | null
          planned_date: string
          preparation?: string | null
          scripture_content?: string | null
          sequence_no?: number
          song?: string | null
          teacher_staff_id?: string | null
          teaching_plan_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          catechism_content?: string | null
          created_at?: string
          game?: string | null
          homework?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["teaching_plan_item_type"]
          material_mime_type?: string | null
          material_name?: string | null
          material_path?: string | null
          material_size?: number | null
          note?: string | null
          objectives?: string | null
          planned_date?: string
          preparation?: string | null
          scripture_content?: string | null
          sequence_no?: number
          song?: string | null
          teacher_staff_id?: string | null
          teaching_plan_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teaching_plan_items_teacher_staff_id_fkey"
            columns: ["teacher_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_plan_items_teaching_plan_id_fkey"
            columns: ["teaching_plan_id"]
            isOneToOne: false
            referencedRelation: "teaching_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_plan_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_plans: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          created_by_staff_id: string | null
          id: string
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          created_by_staff_id?: string | null
          id?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          created_by_staff_id?: string | null
          id?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teaching_plans_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_plans_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "teaching_plans_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: true
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_plans_created_by_staff_id_fkey"
            columns: ["created_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_plans_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_class_attendance_summary: {
        Row: {
          academic_year_id: string | null
          catechism_attendance_score: number | null
          catechism_rate: number | null
          class_id: string | null
          last_session_date: string | null
          mass_attendance_score: number | null
          mass_rate: number | null
          student_count: number | null
          warned_student_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
        ]
      }
      v_dashboard_summary: {
        Row: {
          academic_year_code: string | null
          academic_year_id: string | null
          academic_year_status:
            | Database["public"]["Enums"]["academic_year_status"]
            | null
          catechism_rate: number | null
          class_count: number | null
          last_session_date: string | null
          mass_rate: number | null
          staff_count: number | null
          student_count: number | null
          warned_student_count: number | null
        }
        Relationships: []
      }
      v_incomplete_student_profiles: {
        Row: {
          full_name: string | null
          missing_address: boolean | null
          missing_guardian_phone: boolean | null
          missing_patron_feast: boolean | null
          saint_name: string | null
          student_id: string | null
        }
        Relationships: []
      }
      v_staff_attendance_summary: {
        Row: {
          academic_year_id: string | null
          class_id: string | null
          excused_count: number | null
          last_session_date: string | null
          present_count: number | null
          present_rate: number | null
          sessions_counted: number | null
          staff_profile_id: string | null
          unexcused_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "staff_attendance_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_records_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_student_attendance_summary: {
        Row: {
          academic_year_id: string | null
          catechism_absence_streak: number | null
          catechism_absent_count: number | null
          catechism_attendance_score: number | null
          catechism_present_count: number | null
          catechism_rate: number | null
          catechism_unexcused_count: number | null
          class_id: string | null
          last_session_date: string | null
          mass_absent_count: number | null
          mass_attendance_score: number | null
          mass_catechism_mismatch_count: number | null
          mass_present_count: number | null
          mass_rate: number | null
          mass_unexcused_count: number | null
          sessions_counted: number | null
          student_id: string | null
          sunday_absence_streak: number | null
          warn_consecutive_absence: boolean | null
          warn_consecutive_sunday: boolean | null
          warn_low_rate: boolean | null
          warn_mass_catechism_mismatch: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "student_attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_celebrations"
            referencedColumns: ["student_id"]
          },
        ]
      }
      v_student_weighted_average: {
        Row: {
          academic_year_id: string | null
          class_id: string | null
          enrollment_id: string | null
          scored_assessment_count: number | null
          student_id: string | null
          weighted_average: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_scores_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "assessment_scores_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "assessment_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_celebrations"
            referencedColumns: ["student_id"]
          },
        ]
      }
      v_students_at_risk: {
        Row: {
          academic_year_id: string | null
          catechism_absence_streak: number | null
          catechism_attendance_score: number | null
          catechism_rate: number | null
          class_id: string | null
          class_name: string | null
          full_name: string | null
          mass_attendance_score: number | null
          saint_name: string | null
          student_id: string | null
          sunday_absence_streak: number | null
          warn_consecutive_absence: boolean | null
          warn_consecutive_sunday: boolean | null
          warn_low_average: boolean | null
          warn_low_rate: boolean | null
          weighted_average: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "student_attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_student_profiles"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_upcoming_celebrations"
            referencedColumns: ["student_id"]
          },
        ]
      }
      v_upcoming_celebrations: {
        Row: {
          celebrated_on: string | null
          full_name: string | null
          kind: string | null
          next_occurrence: string | null
          saint_name: string | null
          student_id: string | null
        }
        Relationships: []
      }
      v_upcoming_teaching_items: {
        Row: {
          academic_year_id: string | null
          class_id: string | null
          class_name: string | null
          id: string | null
          is_assessment: boolean | null
          item_type:
            | Database["public"]["Enums"]["teaching_plan_item_type"]
            | null
          planned_date: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teaching_plans_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_plans_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_summary"
            referencedColumns: ["academic_year_id"]
          },
          {
            foreignKeyName: "teaching_plans_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: true
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_promotion_review: {
        Args: {
          p_decision: string
          p_note?: string
          p_review_id: string
          p_target_class_id?: string
        }
        Returns: string
      }
      borrow_equipment: {
        Args: {
          p_borrower_staff_id: string
          p_equipment_item_id: string
          p_expected_return_at?: string
          p_note?: string
          p_quantity: number
        }
        Returns: string
      }
      claim_attendance_session: {
        Args: {
          p_class_id: string
          p_date: string
          p_meeting_type: Database["public"]["Enums"]["meeting_type"]
        }
        Returns: {
          out_claimed: boolean
          out_editor_display_name: string
          out_editor_profile_id: string
          out_lease_expires_at: string
          out_locked: boolean
          out_session_id: string
          out_status: Database["public"]["Enums"]["attendance_session_status"]
        }[]
      }
      commit_import_rows: {
        Args: { p_batch_id: string; p_row_ids: string[] }
        Returns: {
          out_committed: boolean
          out_error_message: string
          out_row_id: string
          out_row_number: number
          out_student_code: string
          out_student_id: string
        }[]
      }
      complete_password_change: { Args: never; Returns: undefined }
      end_class_staff_assignment: {
        Args: { target_assignment_id: string; target_ends_on: string }
        Returns: undefined
      }
      generate_default_classes: {
        Args: { target_academic_year_id: string }
        Returns: number
      }
      get_week_ahead_teaching_items: {
        Args: { p_days?: number; p_from: string }
        Returns: {
          class_id: string
          class_name: string
          item_id: string
          item_type: Database["public"]["Enums"]["teaching_plan_item_type"]
          planned_date: string
          preparation: string
          teacher_name: string
          title: string
        }[]
      }
      heartbeat_attendance_session: {
        Args: { p_session_id: string }
        Returns: string
      }
      lock_gradebook: { Args: { p_class_id: string }; Returns: undefined }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      preview_leaderboard: {
        Args: { p_custom_scores?: Json; p_leaderboard_id: string }
        Returns: {
          out_enrollment_id: string
          out_full_name: string
          out_rank: number
          out_saint_name: string
          out_score: number
        }[]
      }
      propose_promotion: {
        Args: {
          p_note?: string
          p_propose_trainee?: boolean
          p_proposed_status: Database["public"]["Enums"]["promotion_status"]
          p_source_enrollment_id: string
          p_target_class_id?: string
        }
        Returns: string
      }
      publish_leaderboard: {
        Args: { p_custom_scores?: Json; p_leaderboard_id: string }
        Returns: number
      }
      publish_notification: {
        Args: {
          p_content: string
          p_link_path?: string
          p_target_id?: string
          p_target_type: Database["public"]["Enums"]["notification_target_type"]
          p_title: string
        }
        Returns: string
      }
      refresh_attendance_assessment_scores: {
        Args: { p_assessment_id: string }
        Returns: number
      }
      report_attendance_rows: {
        Args: { p_academic_year_id: string; p_from: string; p_to: string }
        Returns: {
          catechism_absent_count: number
          catechism_present_rate: number
          class_id: string
          class_name: string
          mass_absent_count: number
          mass_present_rate: number
          sector_id: string
          session_count: number
          student_count: number
        }[]
      }
      report_results_rows: {
        Args: { p_academic_year_id: string }
        Returns: {
          below_five_count: number
          class_average: number
          class_id: string
          class_name: string
          excellent_count: number
          sector_id: string
          student_count: number
        }[]
      }
      reset_attendance_score_override: {
        Args: { p_assessment_id: string; p_enrollment_id: string }
        Returns: undefined
      }
      return_equipment: {
        Args: {
          p_condition?: Database["public"]["Enums"]["equipment_condition"]
          p_loan_id: string
          p_note?: string
          p_restored_quantity?: number
        }
        Returns: string
      }
      save_and_finalize_attendance: {
        Args: {
          p_finalize: boolean
          p_session_id: string
          p_staff: Json
          p_students: Json
        }
        Returns: {
          out_finalized_at: string
          out_locked_at: string
          out_session_id: string
          out_staff_present: number
          out_staff_total: number
          out_status: Database["public"]["Enums"]["attendance_session_status"]
          out_student_absent: number
          out_student_present: number
          out_student_total: number
        }[]
      }
      save_assessment_scores: {
        Args: { p_assessment_id: string; p_scores: Json }
        Returns: number
      }
      set_current_academic_year: {
        Args: { target_academic_year_id: string }
        Returns: undefined
      }
      takeover_attendance_session: {
        Args: { p_session_id: string }
        Returns: string
      }
      unlock_attendance_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      unlock_gradebook: { Args: { p_class_id: string }; Returns: undefined }
    }
    Enums: {
      absence_request_status: "pending" | "acknowledged" | "cancelled"
      academic_year_status: "draft" | "current" | "closed" | "archived"
      account_status: "active" | "locked" | "disabled"
      app_role:
        | "super_admin"
        | "parish_priest"
        | "chaplain"
        | "group_leader"
        | "deputy_group_leader"
        | "secretary"
        | "treasurer"
        | "sector_leader"
        | "sector_deputy"
        | "class_representative"
        | "class_teacher"
        | "trainee_assistant"
        | "guardian"
        | "student"
      assessment_kind:
        | "quiz_15m"
        | "midterm"
        | "final"
        | "attendance"
        | "custom"
      attendance_score_component: "mass" | "catechism"
      attendance_session_status: "open" | "in_progress" | "completed" | "locked"
      attendance_status:
        | "present"
        | "excused_absence"
        | "unexcused_absence"
        | "late"
        | "left_early"
      class_kind: "catechism" | "trainee"
      class_staff_capacity: "representative" | "member" | "trainee"
      class_status: "active" | "inactive" | "closed"
      comment_visibility: "student_visible" | "staff_only"
      committee_position: "supreme_advisor" | "leader" | "deputy" | "member"
      enrollment_status:
        | "active"
        | "paused"
        | "completed"
        | "repeating"
        | "transferred"
        | "withdrawn"
      equipment_condition:
        | "good"
        | "needs_maintenance"
        | "damaged"
        | "lost"
        | "retired"
      formation_level: "none" | "i" | "ii" | "iii" | "special"
      gender: "male" | "female" | "other"
      guardian_status: "active" | "inactive"
      import_batch_status:
        | "dry_run"
        | "partially_committed"
        | "committed"
        | "cancelled"
      import_row_action: "create" | "merge" | "skip"
      import_row_status: "valid" | "warning" | "error" | "committed" | "skipped"
      leaderboard_source_type:
        | "assessment"
        | "temporary_weighted_average"
        | "final_average"
        | "custom_competition"
      meeting_type: "thursday" | "sunday"
      notification_target_type:
        | "all"
        | "sector"
        | "class"
        | "committee"
        | "user"
        | "guardians"
        | "students"
      promotion_status:
        | "pending"
        | "recommended_promote"
        | "recommended_repeat"
        | "temporarily_pause"
        | "withdraw"
        | "approved"
        | "rejected"
      sacrament_type:
        | "baptism"
        | "first_confession"
        | "first_communion"
        | "confirmation"
        | "profession"
        | "other"
      staff_attendance_status:
        | "present"
        | "excused_absence"
        | "unexcused_absence"
      staff_service_status: "active" | "paused" | "inactive"
      staff_title: "anh" | "chi" | "di" | "so" | "cha" | "thay" | "other"
      student_status:
        | "active"
        | "temporarily_inactive"
        | "withdrawn"
        | "archived"
      teaching_plan_item_type: "lesson" | "assessment"
      term_scope: "full_year" | "semester_1"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      absence_request_status: ["pending", "acknowledged", "cancelled"],
      academic_year_status: ["draft", "current", "closed", "archived"],
      account_status: ["active", "locked", "disabled"],
      app_role: [
        "super_admin",
        "parish_priest",
        "chaplain",
        "group_leader",
        "deputy_group_leader",
        "secretary",
        "treasurer",
        "sector_leader",
        "sector_deputy",
        "class_representative",
        "class_teacher",
        "trainee_assistant",
        "guardian",
        "student",
      ],
      assessment_kind: ["quiz_15m", "midterm", "final", "attendance", "custom"],
      attendance_score_component: ["mass", "catechism"],
      attendance_session_status: ["open", "in_progress", "completed", "locked"],
      attendance_status: [
        "present",
        "excused_absence",
        "unexcused_absence",
        "late",
        "left_early",
      ],
      class_kind: ["catechism", "trainee"],
      class_staff_capacity: ["representative", "member", "trainee"],
      class_status: ["active", "inactive", "closed"],
      comment_visibility: ["student_visible", "staff_only"],
      committee_position: ["supreme_advisor", "leader", "deputy", "member"],
      enrollment_status: [
        "active",
        "paused",
        "completed",
        "repeating",
        "transferred",
        "withdrawn",
      ],
      equipment_condition: [
        "good",
        "needs_maintenance",
        "damaged",
        "lost",
        "retired",
      ],
      formation_level: ["none", "i", "ii", "iii", "special"],
      gender: ["male", "female", "other"],
      guardian_status: ["active", "inactive"],
      import_batch_status: [
        "dry_run",
        "partially_committed",
        "committed",
        "cancelled",
      ],
      import_row_action: ["create", "merge", "skip"],
      import_row_status: ["valid", "warning", "error", "committed", "skipped"],
      leaderboard_source_type: [
        "assessment",
        "temporary_weighted_average",
        "final_average",
        "custom_competition",
      ],
      meeting_type: ["thursday", "sunday"],
      notification_target_type: [
        "all",
        "sector",
        "class",
        "committee",
        "user",
        "guardians",
        "students",
      ],
      promotion_status: [
        "pending",
        "recommended_promote",
        "recommended_repeat",
        "temporarily_pause",
        "withdraw",
        "approved",
        "rejected",
      ],
      sacrament_type: [
        "baptism",
        "first_confession",
        "first_communion",
        "confirmation",
        "profession",
        "other",
      ],
      staff_attendance_status: [
        "present",
        "excused_absence",
        "unexcused_absence",
      ],
      staff_service_status: ["active", "paused", "inactive"],
      staff_title: ["anh", "chi", "di", "so", "cha", "thay", "other"],
      student_status: [
        "active",
        "temporarily_inactive",
        "withdrawn",
        "archived",
      ],
      teaching_plan_item_type: ["lesson", "assessment"],
      term_scope: ["full_year", "semester_1"],
    },
  },
} as const

