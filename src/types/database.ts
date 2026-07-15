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
      academic_years: {
        Row: {
          attendance_edit_lease_minutes: number
          attendance_lock_days: number
          code: string
          created_at: string
          end_date: string
          id: string
          name: string
          retention_until: string
          start_date: string
          status: Database["public"]["Enums"]["academic_year_status"]
          top5_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          attendance_edit_lease_minutes?: number
          attendance_lock_days?: number
          code: string
          created_at?: string
          end_date: string
          id?: string
          name: string
          retention_until: string
          start_date: string
          status?: Database["public"]["Enums"]["academic_year_status"]
          top5_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          attendance_edit_lease_minutes?: number
          attendance_lock_days?: number
          code?: string
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          retention_until?: string
          start_date?: string
          status?: Database["public"]["Enums"]["academic_year_status"]
          top5_enabled?: boolean
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
          created_at: string
          display_name: string
          grade_level_id: string
          id: string
          is_active: boolean
          section_code: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          grade_level_id: string
          id?: string
          is_active?: boolean
          section_code?: string | null
          sort_order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          grade_level_id?: string
          id?: string
          is_active?: boolean
          section_code?: string | null
          sort_order?: number
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
          created_at: string
          display_name: string
          grade_level_id: string
          id: string
          meeting_location: string | null
          notes: string | null
          section_code: string | null
          status: Database["public"]["Enums"]["class_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          display_name: string
          grade_level_id: string
          id?: string
          meeting_location?: string | null
          notes?: string | null
          section_code?: string | null
          status?: Database["public"]["Enums"]["class_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          display_name?: string
          grade_level_id?: string
          id?: string
          meeting_location?: string | null
          notes?: string | null
          section_code?: string | null
          status?: Database["public"]["Enums"]["class_status"]
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
      grade_levels: {
        Row: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_password_change: { Args: never; Returns: undefined }
      end_class_staff_assignment: {
        Args: { target_assignment_id: string; target_ends_on: string }
        Returns: undefined
      }
      generate_default_classes: {
        Args: { target_academic_year_id: string }
        Returns: number
      }
      set_current_academic_year: {
        Args: { target_academic_year_id: string }
        Returns: undefined
      }
    }
    Enums: {
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
      attendance_status:
        | "present"
        | "excused_absence"
        | "unexcused_absence"
        | "late"
        | "left_early"
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
      attendance_status: [
        "present",
        "excused_absence",
        "unexcused_absence",
        "late",
        "left_early",
      ],
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
    },
  },
} as const

