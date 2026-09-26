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
      task_evidence: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          run_id: string | null
          task_id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind: string
          run_id?: string | null
          task_id: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          run_id?: string | null
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_evidence_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "worker_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_evidence_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "worker_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_verifications: {
        Row: {
          created_at: string
          id: string
          note: string
          run_id: string | null
          task_id: string
          verdict: string
          verified_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          run_id?: string | null
          task_id: string
          verdict: string
          verified_by: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          run_id?: string | null
          task_id?: string
          verdict?: string
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_verifications_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "worker_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_verifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "worker_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string
          created_at: string
          detail: Json
          from_status: string | null
          id: number
          task_id: string | null
          to_status: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label: string
          created_at?: string
          detail?: Json
          from_status?: string | null
          id?: never
          task_id?: string | null
          to_status?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string
          created_at?: string
          detail?: Json
          from_status?: string | null
          id?: never
          task_id?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_audit_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "worker_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          model: string | null
          started_at: string
          started_by: string
          status: string
          task_id: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          model?: string | null
          started_at?: string
          started_by: string
          status: string
          task_id: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          model?: string | null
          started_at?: string
          started_by?: string
          status?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_runs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "worker_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_tasks: {
        Row: {
          agent_id: string
          approved_at: string | null
          approved_by: string | null
          attempts: number
          created_at: string
          created_by: string
          id: string
          instructions: string
          priority: string
          requires_approval: boolean
          source: string
          status: Database["public"]["Enums"]["worker_task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          approved_at?: string | null
          approved_by?: string | null
          attempts?: number
          created_at?: string
          created_by: string
          id?: string
          instructions?: string
          priority?: string
          requires_approval?: boolean
          source?: string
          status?: Database["public"]["Enums"]["worker_task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          approved_at?: string | null
          approved_by?: string | null
          attempts?: number
          created_at?: string
          created_by?: string
          id?: string
          instructions?: string
          priority?: string
          requires_approval?: boolean
          source?: string
          status?: Database["public"]["Enums"]["worker_task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      worker_task_status:
        | "queued"
        | "waiting_approval"
        | "approved"
        | "running"
        | "completed"
        | "failed"
        | "verified"
        | "rejected"
        | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      worker_task_status: [
        "queued",
        "waiting_approval",
        "approved",
        "running",
        "completed",
        "failed",
        "verified",
        "rejected",
        "cancelled",
      ],
    },
  },
} as const
