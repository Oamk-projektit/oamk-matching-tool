/**
 * This file is auto-generated from the local Supabase/Postgres schema.
 * Do not edit by hand. Regenerate with:
 *   supabase gen types typescript --local > types/database.ts
 * or (Docker CLI unavailable):
 *   node scripts/gen-database-types.mjs
 *
 * Generated: 2026-08-04T13:21:40.738Z
 */

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
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          id: string
          project_id: string
          student_id: string
          status: string
          message: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          student_id: string
          status?: string
          message?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          student_id?: string
          status?: string
          message?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          id: string
          actor_profile_id: string | null
          action: string
          entity_type: string
          entity_id: string
          old_values: Json | null
          new_values: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_profile_id?: string | null
          action: string
          entity_type: string
          entity_id: string
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_profile_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          id: string
          name: string
          description: string | null
          website: string | null
          created_at: string
          updated_at: string
          business_id: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
          business_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
          business_id?: string | null
        }
        Relationships: [
        ]
      }
      company_users: {
        Row: {
          id: string
          company_id: string
          profile_id: string
          created_at: string
          company_role: string
        }
        Insert: {
          id?: string
          company_id: string
          profile_id: string
          created_at?: string
          company_role?: string
        }
        Update: {
          id?: string
          company_id?: string
          profile_id?: string
          created_at?: string
          company_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          id: string
          code: string
          name_fi: string
          name_en: string
          credits: number
          department: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name_fi: string
          name_en: string
          credits?: number
          department?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name_fi?: string
          name_en?: string
          credits?: number
          department?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
      interests: {
        Row: {
          id: string
          name_fi: string
          name_en: string
          normalized_name: string
          created_at: string
        }
        Insert: {
          id?: string
          name_fi: string
          name_en: string
          normalized_name: string
          created_at?: string
        }
        Update: {
          id?: string
          name_fi?: string
          name_en?: string
          normalized_name?: string
          created_at?: string
        }
        Relationships: [
        ]
      }
      matches: {
        Row: {
          id: string
          project_id: string
          student_id: string
          total_score: number
          score_breakdown: Json
          matched_courses: string[]
          missing_required_courses: string[]
          matched_skills: string[]
          missing_required_skills: string[]
          explanation: string
          weights_snapshot: Json
          calculated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          student_id: string
          total_score: number
          score_breakdown?: Json
          matched_courses?: string[]
          missing_required_courses?: string[]
          matched_skills?: string[]
          missing_required_skills?: string[]
          explanation?: string
          weights_snapshot?: Json
          calculated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          student_id?: string
          total_score?: number
          score_breakdown?: Json
          matched_courses?: string[]
          missing_required_courses?: string[]
          matched_skills?: string[]
          missing_required_skills?: string[]
          explanation?: string
          weights_snapshot?: Json
          calculated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          profile_id: string
          education_field_code: string | null
          degree_programme_code: string | null
          specialization_code: string | null
          type: string
          language: string
          title: string
          body: string
          read_at: string | null
          created_at: string
          idempotency_key: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          education_field_code?: string | null
          degree_programme_code?: string | null
          specialization_code?: string | null
          type: string
          language?: string
          title: string
          body: string
          read_at?: string | null
          created_at?: string
          idempotency_key?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          education_field_code?: string | null
          degree_programme_code?: string | null
          specialization_code?: string | null
          type?: string
          language?: string
          title?: string
          body?: string
          read_at?: string | null
          created_at?: string
          idempotency_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          role: string
          display_name: string
          email: string
          preferred_language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          role?: string
          display_name: string
          email: string
          preferred_language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: string
          display_name?: string
          email?: string
          preferred_language?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
        ]
      }
      project_interests: {
        Row: {
          id: string
          project_id: string
          interest_id: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          interest_id: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          interest_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_interests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_recommended_courses: {
        Row: {
          id: string
          project_id: string
          course_id: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          course_id: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          course_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_recommended_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_recommended_courses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_recommended_skills: {
        Row: {
          id: string
          project_id: string
          skill_id: string
          created_at: string
          level: string | null
        }
        Insert: {
          id?: string
          project_id: string
          skill_id: string
          created_at?: string
          level?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          skill_id?: string
          created_at?: string
          level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_recommended_skills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_recommended_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      project_required_courses: {
        Row: {
          id: string
          project_id: string
          course_id: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          course_id: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          course_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_required_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_required_courses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_required_skills: {
        Row: {
          id: string
          project_id: string
          skill_id: string
          created_at: string
          level: string | null
        }
        Insert: {
          id?: string
          project_id: string
          skill_id: string
          created_at?: string
          level?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          skill_id?: string
          created_at?: string
          level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_required_skills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_required_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      project_weights: {
        Row: {
          id: string
          project_id: string
          study_credits: number
          required_courses: number
          recommended_courses: number
          skills: number
          language: number
          availability: number
          interests: number
          degree_programme: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          study_credits?: number
          required_courses?: number
          recommended_courses?: number
          skills?: number
          language?: number
          availability?: number
          interests?: number
          degree_programme?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          study_credits?: number
          required_courses?: number
          recommended_courses?: number
          skills?: number
          language?: number
          availability?: number
          interests?: number
          degree_programme?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_weights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string
          project_type: string
          status: string
          positions: number
          application_start: string | null
          application_deadline: string | null
          project_start: string | null
          project_end: string | null
          work_mode: string
          location: string | null
          remote_allowed: boolean
          minimum_study_credits: number
          required_language: string
          department: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description?: string
          project_type: string
          status?: string
          positions?: number
          application_start?: string | null
          application_deadline?: string | null
          project_start?: string | null
          project_end?: string | null
          work_mode?: string
          location?: string | null
          remote_allowed?: boolean
          minimum_study_credits?: number
          required_language?: string
          department?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          description?: string
          project_type?: string
          status?: string
          positions?: number
          application_start?: string | null
          application_deadline?: string | null
          project_start?: string | null
          project_end?: string | null
          work_mode?: string
          location?: string | null
          remote_allowed?: boolean
          minimum_study_credits?: number
          required_language?: string
          department?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      selection_decisions: {
        Row: {
          id: string
          project_id: string
          student_id: string
          application_id: string
          decision: string
          decided_by: string
          reason: string | null
          decided_at: string
          match_id: string | null
          match_snapshot: Json | null
          weights_snapshot: Json | null
          algorithm_rank: number | null
        }
        Insert: {
          id?: string
          project_id: string
          student_id: string
          application_id: string
          decision: string
          decided_by: string
          reason?: string | null
          decided_at?: string
          match_id?: string | null
          match_snapshot?: Json | null
          weights_snapshot?: Json | null
          algorithm_rank?: number | null
        }
        Update: {
          id?: string
          project_id?: string
          student_id?: string
          application_id?: string
          decision?: string
          decided_by?: string
          reason?: string | null
          decided_at?: string
          match_id?: string | null
          match_snapshot?: Json | null
          weights_snapshot?: Json | null
          algorithm_rank?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "selection_decisions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selection_decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selection_decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selection_decisions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          id: string
          name_fi: string
          name_en: string
          normalized_name: string
          created_at: string
        }
        Insert: {
          id?: string
          name_fi: string
          name_en: string
          normalized_name: string
          created_at?: string
        }
        Update: {
          id?: string
          name_fi?: string
          name_en?: string
          normalized_name?: string
          created_at?: string
        }
        Relationships: [
        ]
      }
      student_courses: {
        Row: {
          id: string
          student_id: string
          course_id: string
          created_at: string
          completion_status: string
          completed_at: string | null
          grade: string | null
          verified: boolean
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          created_at?: string
          completion_status?: string
          completed_at?: string | null
          grade?: string | null
          verified?: boolean
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          created_at?: string
          completion_status?: string
          completed_at?: string | null
          grade?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "student_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_courses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_interests: {
        Row: {
          id: string
          student_id: string
          interest_id: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          interest_id: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          interest_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_interests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_skills: {
        Row: {
          id: string
          student_id: string
          skill_id: string
          created_at: string
          level: string | null
        }
        Insert: {
          id?: string
          student_id: string
          skill_id: string
          created_at?: string
          level?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          skill_id?: string
          created_at?: string
          level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_skills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          id: string
          profile_id: string
          degree_programme: string | null
          department: string | null
          study_credits: number
          availability_start: string | null
          availability_end: string | null
          preferred_project_types: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          degree_programme?: string | null
          department?: string | null
          study_credits?: number
          availability_start?: string | null
          availability_end?: string | null
          preferred_project_types?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          degree_programme?: string | null
          department?: string | null
          study_credits?: number
          availability_start?: string | null
          availability_end?: string | null
          preferred_project_types?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
