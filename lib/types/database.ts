/**
 * Database types.
 *
 * Generated from the schema with `npm run db:types`
 * (`supabase gen types typescript --local --schema public`).
 *
 * Do not hand-edit: change a migration and regenerate, so this file and the
 * database can never disagree about a column.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          business_name: string | null;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          business_name?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          business_name?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          created_at: string;
          id: string;
          item: string | null;
          page: string | null;
          type: Database["public"]["Enums"]["event_type"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          item?: string | null;
          page?: string | null;
          type: Database["public"]["Enums"]["event_type"];
        };
        Update: {
          created_at?: string;
          id?: string;
          item?: string | null;
          page?: string | null;
          type?: Database["public"]["Enums"]["event_type"];
        };
        Relationships: [];
      };
      expense_categories: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          category_id: string | null;
          created_at: string;
          date: string;
          description: string | null;
          id: string;
          method: Database["public"]["Enums"]["payment_method"];
          receipt_url: string | null;
          recurring: Database["public"]["Enums"]["reminder_repeat"];
          updated_at: string;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string;
          date?: string;
          description?: string | null;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          receipt_url?: string | null;
          recurring?: Database["public"]["Enums"]["reminder_repeat"];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          date?: string;
          description?: string | null;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          receipt_url?: string | null;
          recurring?: Database["public"]["Enums"]["reminder_repeat"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "expense_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      income: {
        Row: {
          amount: number;
          category: string | null;
          client_id: string | null;
          created_at: string;
          date: string;
          id: string;
          method: Database["public"]["Enums"]["payment_method"];
          notes: string | null;
          project_id: string | null;
          reference: string | null;
          updated_at: string;
        };
        Insert: {
          amount: number;
          category?: string | null;
          client_id?: string | null;
          created_at?: string;
          date?: string;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          notes?: string | null;
          project_id?: string | null;
          reference?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          category?: string | null;
          client_id?: string | null;
          created_at?: string;
          date?: string;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          notes?: string | null;
          project_id?: string | null;
          reference?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "income_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "income_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          name: string;
          need: string | null;
          phone: string | null;
          source_page: string | null;
          status: Database["public"]["Enums"]["message_status"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          name: string;
          need?: string | null;
          phone?: string | null;
          source_page?: string | null;
          status?: Database["public"]["Enums"]["message_status"];
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          name?: string;
          need?: string | null;
          phone?: string | null;
          source_page?: string | null;
          status?: Database["public"]["Enums"]["message_status"];
        };
        Relationships: [];
      };
      portfolio_items: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          images: NonNullable<Json>;
          live_url: string | null;
          slug: string;
          sort_order: number;
          technologies: NonNullable<Json>;
          title: string;
          type: string | null;
          updated_at: string;
          visible: boolean;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: NonNullable<Json>;
          live_url?: string | null;
          slug: string;
          sort_order?: number;
          technologies?: NonNullable<Json>;
          title: string;
          type?: string | null;
          updated_at?: string;
          visible?: boolean;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: NonNullable<Json>;
          live_url?: string | null;
          slug?: string;
          sort_order?: number;
          technologies?: NonNullable<Json>;
          title?: string;
          type?: string | null;
          updated_at?: string;
          visible?: boolean;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          author_id: string | null;
          body: Json | null;
          cover_image: string | null;
          created_at: string;
          id: string;
          meta_description: string | null;
          meta_title: string | null;
          published_at: string | null;
          slug: string;
          status: Database["public"]["Enums"]["post_status"];
          summary: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          body?: Json | null;
          cover_image?: string | null;
          created_at?: string;
          id?: string;
          meta_description?: string | null;
          meta_title?: string | null;
          published_at?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["post_status"];
          summary?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          body?: Json | null;
          cover_image?: string | null;
          created_at?: string;
          id?: string;
          meta_description?: string | null;
          meta_title?: string | null;
          published_at?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["post_status"];
          summary?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          badge: Database["public"]["Enums"]["product_badge"];
          created_at: string;
          description: string | null;
          features: NonNullable<Json>;
          id: string;
          images: NonNullable<Json>;
          name: string;
          pricing_text: string | null;
          slug: string;
          sort_order: number;
          updated_at: string;
          visible: boolean;
          whatsapp_message: string | null;
        };
        Insert: {
          badge?: Database["public"]["Enums"]["product_badge"];
          created_at?: string;
          description?: string | null;
          features?: NonNullable<Json>;
          id?: string;
          images?: NonNullable<Json>;
          name: string;
          pricing_text?: string | null;
          slug: string;
          sort_order?: number;
          updated_at?: string;
          visible?: boolean;
          whatsapp_message?: string | null;
        };
        Update: {
          badge?: Database["public"]["Enums"]["product_badge"];
          created_at?: string;
          description?: string | null;
          features?: NonNullable<Json>;
          id?: string;
          images?: NonNullable<Json>;
          name?: string;
          pricing_text?: string | null;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
          visible?: boolean;
          whatsapp_message?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      project_tasks: {
        Row: {
          created_at: string;
          done: boolean;
          id: string;
          project_id: string;
          sort_order: number;
          title: string;
        };
        Insert: {
          created_at?: string;
          done?: boolean;
          id?: string;
          project_id: string;
          sort_order?: number;
          title: string;
        };
        Update: {
          created_at?: string;
          done?: boolean;
          id?: string;
          project_id?: string;
          sort_order?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          archived: boolean;
          client_id: string | null;
          created_at: string;
          deadline: string | null;
          description: string | null;
          id: string;
          name: string;
          notes: string | null;
          price: number;
          start_date: string | null;
          status: Database["public"]["Enums"]["project_status"];
          type: Database["public"]["Enums"]["project_type"];
          updated_at: string;
        };
        Insert: {
          archived?: boolean;
          client_id?: string | null;
          created_at?: string;
          deadline?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          price?: number;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          type?: Database["public"]["Enums"]["project_type"];
          updated_at?: string;
        };
        Update: {
          archived?: boolean;
          client_id?: string | null;
          created_at?: string;
          deadline?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          price?: number;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          type?: Database["public"]["Enums"]["project_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      reminders: {
        Row: {
          client_id: string | null;
          created_at: string;
          description: string | null;
          done: boolean;
          due_at: string;
          id: string;
          notified_at: string | null;
          notify_email: boolean;
          project_id: string | null;
          repeat_rule: Database["public"]["Enums"]["reminder_repeat"];
          title: string;
          updated_at: string;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          description?: string | null;
          done?: boolean;
          due_at: string;
          id?: string;
          notified_at?: string | null;
          notify_email?: boolean;
          project_id?: string | null;
          repeat_rule?: Database["public"]["Enums"]["reminder_repeat"];
          title: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          description?: string | null;
          done?: boolean;
          due_at?: string;
          id?: string;
          notified_at?: string | null;
          notify_email?: boolean;
          project_id?: string | null;
          repeat_rule?: Database["public"]["Enums"]["reminder_repeat"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminders_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reminders_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          created_at: string;
          full_desc: string | null;
          icon: string | null;
          id: string;
          name: string;
          short_desc: string | null;
          slug: string;
          sort_order: number;
          updated_at: string;
          visible: boolean;
          whatsapp_message: string | null;
        };
        Insert: {
          created_at?: string;
          full_desc?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          short_desc?: string | null;
          slug: string;
          sort_order?: number;
          updated_at?: string;
          visible?: boolean;
          whatsapp_message?: string | null;
        };
        Update: {
          created_at?: string;
          full_desc?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          short_desc?: string | null;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
          visible?: boolean;
          whatsapp_message?: string | null;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          company_name: string;
          default_whatsapp_greeting: string | null;
          email: string | null;
          id: boolean;
          location: string | null;
          phone: string | null;
          socials: NonNullable<Json>;
          tagline: string;
          trust_stats: NonNullable<Json>;
          updated_at: string;
          whatsapp_number: string | null;
        };
        Insert: {
          company_name?: string;
          default_whatsapp_greeting?: string | null;
          email?: string | null;
          id?: boolean;
          location?: string | null;
          phone?: string | null;
          socials?: NonNullable<Json>;
          tagline?: string;
          trust_stats?: NonNullable<Json>;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Update: {
          company_name?: string;
          default_whatsapp_greeting?: string | null;
          email?: string | null;
          id?: boolean;
          location?: string | null;
          phone?: string | null;
          socials?: NonNullable<Json>;
          tagline?: string;
          trust_stats?: NonNullable<Json>;
          updated_at?: string;
          whatsapp_number?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      public_settings: {
        Row: {
          company_name: string | null;
          default_whatsapp_greeting: string | null;
          email: string | null;
          location: string | null;
          phone: string | null;
          socials: Json | null;
          tagline: string | null;
          trust_stats: Json | null;
          whatsapp_number: string | null;
        };
        Insert: {
          company_name?: string | null;
          default_whatsapp_greeting?: string | null;
          email?: string | null;
          location?: string | null;
          phone?: string | null;
          socials?: Json | null;
          tagline?: string | null;
          trust_stats?: Json | null;
          whatsapp_number?: string | null;
        };
        Update: {
          company_name?: string | null;
          default_whatsapp_greeting?: string | null;
          email?: string | null;
          location?: string | null;
          phone?: string | null;
          socials?: Json | null;
          tagline?: string | null;
          trust_stats?: Json | null;
          whatsapp_number?: string | null;
        };
        Relationships: [];
      };
      v_monthly_finance: {
        Row: {
          expense_total: number | null;
          income_total: number | null;
          month: string | null;
          profit: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_owner: { Args: Record<PropertyKey, never>; Returns: boolean };
      rate_limit_hit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: { allowed: boolean; retry_after_seconds: number }[];
      };
    };
    Enums: {
      event_type: "page_view" | "whatsapp_click" | "contact_submit";
      message_status: "new" | "replied" | "closed";
      payment_method:
        | "mpesa"
        | "mixx_tigo"
        | "airtel_money"
        | "halopesa"
        | "bank"
        | "cash"
        | "other";
      post_status: "draft" | "published";
      product_badge: "none" | "coming_soon" | "new" | "popular";
      project_status:
        | "planning"
        | "in_progress"
        | "testing"
        | "completed"
        | "on_hold"
        | "cancelled";
      project_type:
        | "custom_system"
        | "website"
        | "system_rental"
        | "automation"
        | "ai"
        | "other";
      reminder_repeat: "none" | "daily" | "weekly" | "monthly";
      user_role: "owner" | "staff";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      event_type: ["page_view", "whatsapp_click", "contact_submit"],
      message_status: ["new", "replied", "closed"],
      payment_method: [
        "mpesa",
        "mixx_tigo",
        "airtel_money",
        "halopesa",
        "bank",
        "cash",
        "other",
      ],
      post_status: ["draft", "published"],
      product_badge: ["none", "coming_soon", "new", "popular"],
      project_status: [
        "planning",
        "in_progress",
        "testing",
        "completed",
        "on_hold",
        "cancelled",
      ],
      project_type: [
        "custom_system",
        "website",
        "system_rental",
        "automation",
        "ai",
        "other",
      ],
      reminder_repeat: ["none", "daily", "weekly", "monthly"],
      user_role: ["owner", "staff"],
    },
  },
} as const;
