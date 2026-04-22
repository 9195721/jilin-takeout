export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: number
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: number
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: number
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      districts: {
        Row: {
          created_at: string | null
          id: number
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          created_at: string | null
          description: string | null
          discount_amount: number | null
          id: number
          merchant_id: number | null
          min_amount: number | null
          title: string
          total_quantity: number | null
          used_quantity: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          id?: number
          merchant_id?: number | null
          min_amount?: number | null
          title: string
          total_quantity?: number | null
          used_quantity?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_amount?: number | null
          id?: number
          merchant_id?: number | null
          min_amount?: number | null
          title?: string
          total_quantity?: number | null
          used_quantity?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_merchant_id_fkey"
            columns: ["merchant_id"]
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: number
          merchant_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          merchant_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          merchant_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_merchant_id_fkey"
            columns: ["merchant_id"]
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          id: number
          merchant_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          merchant_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          merchant_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_merchant_id_fkey"
            columns: ["merchant_id"]
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      member_levels: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: number
          min_views: number | null
          name: string
          privileges: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: number
          min_views?: number | null
          name: string
          privileges?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: number
          min_views?: number | null
          name?: string
          privileges?: string | null
        }
        Relationships: []
      }
      menus: {
        Row: {
          category_id: number | null
          created_at: string | null
          description: string | null
          id: number
          image: string | null
          is_available: boolean | null
          merchant_id: number | null
          name: string
          price: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          image?: string | null
          is_available?: boolean | null
          merchant_id?: number | null
          name: string
          price: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          image?: string | null
          is_available?: boolean | null
          merchant_id?: number | null
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menus_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menus_merchant_id_fkey"
            columns: ["merchant_id"]
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          address: string
          category_id: number | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          district: string | null
          id: number
          images: string[] | null
          is_delivery: boolean | null
          is_open: boolean | null
          is_visible: boolean | null
          is_featured: boolean | null
          is_top: boolean | null
          sort_weight: number | null
          tags: string[] | null
          open_hours: string | null
          member_level_id: number | null
          phone: string
          rating: number | null
          sales_count: number | null
          shop_name: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          views: number | null
        }
        Insert: {
          address: string
          category_id?: number | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          district?: string | null
          id?: number
          images?: string[] | null
          is_delivery?: boolean | null
          is_open?: boolean | null
          is_visible?: boolean | null
          is_featured?: boolean | null
          is_top?: boolean | null
          sort_weight?: number | null
          tags?: string[] | null
          open_hours?: string | null
          member_level_id?: number | null
          phone: string
          rating?: number | null
          sales_count?: number | null
          shop_name: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          views?: number | null
        }
        Update: {
          address?: string
          category_id?: number | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          district?: string | null
          id?: number
          images?: string[] | null
          is_delivery?: boolean | null
          is_open?: boolean | null
          is_visible?: boolean | null
          is_featured?: boolean | null
          is_top?: boolean | null
          sort_weight?: number | null
          tags?: string[] | null
          open_hours?: string | null
          member_level_id?: number | null
          phone?: string
          rating?: number | null
          sales_count?: number | null
          shop_name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "merchants_member_level_id_fkey"
            columns: ["member_level_id"]
            referencedRelation: "member_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchants_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string | null
          id: number
          is_read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: number
          menu_id: number
          order_id: number
          price: number
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          menu_id: number
          order_id: number
          price: number
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: number
          menu_id?: number
          order_id?: number
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_id_fkey"
            columns: ["menu_id"]
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          created_at: string | null
          id: number
          merchant_id: number
          note: string | null
          phone: string
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: number
          merchant_id: number
          note?: string | null
          phone: string
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: number
          merchant_id?: number
          note?: string | null
          phone?: string
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_merchant_id_fkey"
            columns: ["merchant_id"]
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
          username: string | null
          status: string | null
          member_level_id: number | null
          banned_reason: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          username?: string | null
          status?: string | null
          member_level_id?: number | null
          banned_reason?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          username?: string | null
          status?: string | null
          member_level_id?: number | null
          banned_reason?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string | null
          id: number
          merchant_id: number
          rating: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: number
          merchant_id: number
          rating: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: number
          merchant_id?: number
          rating?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_merchant_id_fkey"
            columns: ["merchant_id"]
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_coupons: {
        Row: {
          coupon_id: number
          created_at: string | null
          id: number
          is_used: boolean | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: number
          created_at?: string | null
          id?: number
          is_used?: boolean | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: number
          created_at?: string | null
          id?: number
          is_used?: boolean | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_logs: {
        Row: {
          id: number
          admin_id: string
          admin_name: string | null
          action: string
          target: string | null
          detail: string | null
          ip: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          admin_id: string
          admin_name?: string | null
          action: string
          target?: string | null
          detail?: string | null
          ip?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          admin_id?: string
          admin_name?: string | null
          action?: string
          target?: string | null
          detail?: string | null
          ip?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          id: number
          title: string
          image_url: string
          link_type: string | null
          link_value: string | null
          sort_order: number | null
          is_visible: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          title: string
          image_url: string
          link_type?: string | null
          link_value?: string | null
          sort_order?: number | null
          is_visible?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          title?: string
          image_url?: string
          link_type?: string | null
          link_value?: string | null
          sort_order?: number | null
          is_visible?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: number
          title: string
          content: string
          type: string | null
          is_pinned: boolean | null
          is_visible: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          title: string
          content: string
          type?: string | null
          is_pinned?: boolean | null
          is_visible?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          title?: string
          content?: string
          type?: string | null
          is_pinned?: boolean | null
          is_visible?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_rdsvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      rds_float_normalize_i16: {
        Args: { "": unknown }
        Returns: unknown
      }
      rds_vector_norm: {
        Args: { "": string }
        Returns: number
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "user" | "merchant" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "merchant", "admin"],
    },
  },
} as const
