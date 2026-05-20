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
      access_log: {
        Row: {
          accion: string
          created_at: string | null
          detalle: string | null
          id: string
          profile_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string | null
          detalle?: string | null
          id?: string
          profile_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string | null
          detalle?: string | null
          id?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "app_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_profiles: {
        Row: {
          activo: boolean | null
          cargo: string
          codigo: string
          color: string | null
          created_at: string | null
          id: string
          iniciales: string
          nombre: string
          rol: string
          ultimo_acceso: string | null
        }
        Insert: {
          activo?: boolean | null
          cargo: string
          codigo: string
          color?: string | null
          created_at?: string | null
          id?: string
          iniciales: string
          nombre: string
          rol: string
          ultimo_acceso?: string | null
        }
        Update: {
          activo?: boolean | null
          cargo?: string
          codigo?: string
          color?: string | null
          created_at?: string | null
          id?: string
          iniciales?: string
          nombre?: string
          rol?: string
          ultimo_acceso?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "app_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_alertas: {
        Row: {
          balance_id: string
          folio: number | null
          id: string
          mensaje: string
          pct: number
          programa: string
          tipo: string
          titulo: string
        }
        Insert: {
          balance_id: string
          folio?: number | null
          id?: string
          mensaje: string
          pct: number
          programa: string
          tipo: string
          titulo: string
        }
        Update: {
          balance_id?: string
          folio?: number | null
          id?: string
          mensaje?: string
          pct?: number
          programa?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_alertas_balance_id_fkey"
            columns: ["balance_id"]
            isOneToOne: false
            referencedRelation: "balances"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_items: {
        Row: {
          balance_id: string
          centro_costo: string | null
          compromiso: number
          folio: number | null
          id: string
          pct_avance: number | null
          presupuesto: number
          prog: string | null
          programa_id: string
          saldo: number
          sigfe: number | null
          subt: string | null
          tipo: string
          titulo: string
          ue: number | null
        }
        Insert: {
          balance_id: string
          centro_costo?: string | null
          compromiso?: number
          folio?: number | null
          id?: string
          pct_avance?: number | null
          presupuesto?: number
          prog?: string | null
          programa_id: string
          saldo?: number
          sigfe?: number | null
          subt?: string | null
          tipo: string
          titulo: string
          ue?: number | null
        }
        Update: {
          balance_id?: string
          centro_costo?: string | null
          compromiso?: number
          folio?: number | null
          id?: string
          pct_avance?: number | null
          presupuesto?: number
          prog?: string | null
          programa_id?: string
          saldo?: number
          sigfe?: number | null
          subt?: string | null
          tipo?: string
          titulo?: string
          ue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "balance_items_balance_id_fkey"
            columns: ["balance_id"]
            isOneToOne: false
            referencedRelation: "balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_items_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "balance_programas"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_notes: {
        Row: {
          balance_id: string
          created_at: string | null
          created_by: string | null
          folio: number | null
          id: string
          nota: string
          programa_codigo: string | null
          resolved_at: string | null
          resolved_by: string | null
          tipo: string
        }
        Insert: {
          balance_id: string
          created_at?: string | null
          created_by?: string | null
          folio?: number | null
          id?: string
          nota: string
          programa_codigo?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          tipo?: string
        }
        Update: {
          balance_id?: string
          created_at?: string | null
          created_by?: string | null
          folio?: number | null
          id?: string
          nota?: string
          programa_codigo?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_notes_balance_id_fkey"
            columns: ["balance_id"]
            isOneToOne: false
            referencedRelation: "balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_notes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "app_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_oficinas: {
        Row: {
          balance_id: string
          id: string
          nombre: string
          pct_avance: number | null
          total_compromiso: number
          total_presupuesto: number
          total_saldo: number
        }
        Insert: {
          balance_id: string
          id?: string
          nombre: string
          pct_avance?: number | null
          total_compromiso?: number
          total_presupuesto?: number
          total_saldo?: number
        }
        Update: {
          balance_id?: string
          id?: string
          nombre?: string
          pct_avance?: number | null
          total_compromiso?: number
          total_presupuesto?: number
          total_saldo?: number
        }
        Relationships: [
          {
            foreignKeyName: "balance_oficinas_balance_id_fkey"
            columns: ["balance_id"]
            isOneToOne: false
            referencedRelation: "balances"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_programas: {
        Row: {
          balance_id: string
          codigo: string
          compromiso: number
          id: string
          nombre: string
          oficina_id: string
          pct_avance: number | null
          presupuesto: number
          saldo: number
        }
        Insert: {
          balance_id: string
          codigo: string
          compromiso?: number
          id?: string
          nombre: string
          oficina_id: string
          pct_avance?: number | null
          presupuesto?: number
          saldo?: number
        }
        Update: {
          balance_id?: string
          codigo?: string
          compromiso?: number
          id?: string
          nombre?: string
          oficina_id?: string
          pct_avance?: number | null
          presupuesto?: number
          saldo?: number
        }
        Relationships: [
          {
            foreignKeyName: "balance_programas_balance_id_fkey"
            columns: ["balance_id"]
            isOneToOne: false
            referencedRelation: "balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_programas_oficina_id_fkey"
            columns: ["oficina_id"]
            isOneToOne: false
            referencedRelation: "balance_oficinas"
            referencedColumns: ["id"]
          },
        ]
      }
      balances: {
        Row: {
          archivo_nombre: string | null
          created_at: string | null
          fecha_corte: string | null
          fecha_generacion: string | null
          id: string
          pct_avance_global: number | null
          periodo: string
          total_compromiso: number
          total_items: number | null
          total_presupuesto: number
          total_rows: number | null
          total_saldo: number
        }
        Insert: {
          archivo_nombre?: string | null
          created_at?: string | null
          fecha_corte?: string | null
          fecha_generacion?: string | null
          id?: string
          pct_avance_global?: number | null
          periodo: string
          total_compromiso?: number
          total_items?: number | null
          total_presupuesto?: number
          total_rows?: number | null
          total_saldo?: number
        }
        Update: {
          archivo_nombre?: string | null
          created_at?: string | null
          fecha_corte?: string | null
          fecha_generacion?: string | null
          id?: string
          pct_avance_global?: number | null
          periodo?: string
          total_compromiso?: number
          total_items?: number | null
          total_presupuesto?: number
          total_rows?: number | null
          total_saldo?: number
        }
        Relationships: []
      }
      modification_log: {
        Row: {
          accion: string
          balance_id: string | null
          created_at: string | null
          detalle: Json | null
          entidad: string
          entidad_id: string | null
          id: string
          profile_id: string | null
        }
        Insert: {
          accion: string
          balance_id?: string | null
          created_at?: string | null
          detalle?: Json | null
          entidad: string
          entidad_id?: string | null
          id?: string
          profile_id?: string | null
        }
        Update: {
          accion?: string
          balance_id?: string | null
          created_at?: string | null
          detalle?: Json | null
          entidad?: string
          entidad_id?: string | null
          id?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modification_log_balance_id_fkey"
            columns: ["balance_id"]
            isOneToOne: false
            referencedRelation: "balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modification_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "app_profiles"
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
