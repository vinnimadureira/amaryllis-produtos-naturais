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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          customer_order_id: string | null
          details: string | null
          entity_id: string | null
          entity_type: string
          id: string
          name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          customer_order_id?: string | null
          details?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          customer_order_id?: string | null
          details?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agenda_events: {
        Row: {
          client_id: string | null
          client_name: string | null
          color: string | null
          created_at: string
          customer_order_id: string | null
          description: string | null
          email: string | null
          end_date: string | null
          endereco: string | null
          id: string
          notes: string | null
          order_number: number
          payment_method: string | null
          phone: string | null
          production_start_date: string | null
          produto: string | null
          scheduled_date: string
          shipping_carrier: string | null
          status: string
          tipo: string
          title: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          color?: string | null
          created_at?: string
          customer_order_id?: string | null
          description?: string | null
          email?: string | null
          end_date?: string | null
          endereco?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          payment_method?: string | null
          phone?: string | null
          production_start_date?: string | null
          produto?: string | null
          scheduled_date: string
          shipping_carrier?: string | null
          status?: string
          tipo?: string
          title: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          color?: string | null
          created_at?: string
          customer_order_id?: string | null
          description?: string | null
          email?: string | null
          end_date?: string | null
          endereco?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          payment_method?: string | null
          phone?: string | null
          production_start_date?: string | null
          produto?: string | null
          scheduled_date?: string
          shipping_carrier?: string | null
          status?: string
          tipo?: string
          title?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          active: boolean
          badge: string | null
          created_at: string
          display_order: number
          gradient_from: string
          gradient_to: string
          icon: string
          id: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge?: string | null
          created_at?: string
          display_order?: number
          gradient_from?: string
          gradient_to?: string
          icon?: string
          id?: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge?: string | null
          created_at?: string
          display_order?: number
          gradient_from?: string
          gradient_to?: string
          icon?: string
          id?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      client_match_suggestions: {
        Row: {
          candidate_client_id: string | null
          created_at: string
          created_client_id: string | null
          customer_order_id: string | null
          id: string
          reason: string | null
          resolved_at: string | null
          score: number | null
          status: string
        }
        Insert: {
          candidate_client_id?: string | null
          created_at?: string
          created_client_id?: string | null
          customer_order_id?: string | null
          id?: string
          reason?: string | null
          resolved_at?: string | null
          score?: number | null
          status?: string
        }
        Update: {
          candidate_client_id?: string | null
          created_at?: string
          created_client_id?: string | null
          customer_order_id?: string | null
          id?: string
          reason?: string | null
          resolved_at?: string | null
          score?: number | null
          status?: string
        }
        Relationships: []
      }
      client_messages: {
        Row: {
          channel: string
          client_id: string
          created_at: string
          id: string
          message_date: string
          summary: string
        }
        Insert: {
          channel?: string
          client_id: string
          created_at?: string
          id?: string
          message_date?: string
          summary: string
        }
        Update: {
          channel?: string
          client_id?: string
          created_at?: string
          id?: string
          message_date?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_purchases: {
        Row: {
          agenda_event_id: string | null
          amount: number | null
          client_id: string
          created_at: string
          customer_order_id: string | null
          id: string
          notes: string | null
          product: string
          purchase_date: string
        }
        Insert: {
          agenda_event_id?: string | null
          amount?: number | null
          client_id: string
          created_at?: string
          customer_order_id?: string | null
          id?: string
          notes?: string | null
          product: string
          purchase_date?: string
        }
        Update: {
          agenda_event_id?: string | null
          amount?: number | null
          client_id?: string
          created_at?: string
          customer_order_id?: string | null
          id?: string
          notes?: string | null
          product?: string
          purchase_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_purchases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          birthday: string | null
          cep: string | null
          city: string | null
          complement: string | null
          created_at: string
          document: string | null
          document_type: string | null
          email: string | null
          id: string
          is_vip: boolean
          last_message_date: string | null
          last_purchase_date: string | null
          name: string
          neighborhood: string | null
          notes: string | null
          number: string | null
          phone: string | null
          state: string | null
          street: string | null
        }
        Insert: {
          address?: string | null
          birthday?: string | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string
          document?: string | null
          document_type?: string | null
          email?: string | null
          id?: string
          is_vip?: boolean
          last_message_date?: string | null
          last_purchase_date?: string | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
        }
        Update: {
          address?: string | null
          birthday?: string | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string
          document?: string | null
          document_type?: string | null
          email?: string | null
          id?: string
          is_vip?: boolean
          last_message_date?: string | null
          last_purchase_date?: string | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          assunto: string | null
          created_at: string
          email: string | null
          id: string
          lida: boolean
          mensagem: string
          nome: string
          whatsapp: string
        }
        Insert: {
          assunto?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lida?: boolean
          mensagem: string
          nome: string
          whatsapp: string
        }
        Update: {
          assunto?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lida?: boolean
          mensagem?: string
          nome?: string
          whatsapp?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          current_uses: number
          discount_percent: number
          expires_at: string | null
          id: string
          max_uses: number | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          current_uses?: number
          discount_percent?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          current_uses?: number
          discount_percent?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
        }
        Relationships: []
      }
      customer_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity?: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "customer_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_orders: {
        Row: {
          client_id: string | null
          coupon_code: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_cents: number
          id: string
          metadata: Json
          mp_payment_id: string | null
          mp_preference_id: string | null
          payment_provider: string | null
          shipping_address: Json | null
          shipping_cents: number
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal_cents: number
          total_cents: number
          updated_at: string
          user_id: string | null
          whatsapp_paid_notified_at: string | null
        }
        Insert: {
          client_id?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_cents?: number
          id?: string
          metadata?: Json
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          payment_provider?: string | null
          shipping_address?: Json | null
          shipping_cents?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
          whatsapp_paid_notified_at?: string | null
        }
        Update: {
          client_id?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_cents?: number
          id?: string
          metadata?: Json
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          payment_provider?: string | null
          shipping_address?: Json | null
          shipping_cents?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
          whatsapp_paid_notified_at?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      gallery_filters: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          label: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          label: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          label?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          template: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          template: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          template?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          name?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          id: string
          mensagem: string | null
          nome: string
          produto: string | null
          status: string
          status_history: Json
          tracking_code: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          id?: string
          mensagem?: string | null
          nome: string
          produto?: string | null
          status?: string
          status_history?: Json
          tracking_code?: string | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          id?: string
          mensagem?: string | null
          nome?: string
          produto?: string | null
          status?: string
          status_history?: Json
          tracking_code?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          active: boolean
          content: Json
          created_at: string
          display_order: number
          id: string
          page_key: string
          section_key: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          content?: Json
          created_at?: string
          display_order?: number
          id?: string
          page_key: string
          section_key: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          content?: Json
          created_at?: string
          display_order?: number
          id?: string
          page_key?: string
          section_key?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          allow_direct_purchase: boolean
          category: string
          created_at: string
          description: string | null
          featured: boolean
          height_cm: number
          id: string
          image_url: string | null
          length_cm: number
          name: string
          price: number
          price_display: string
          stripe_price_id: string | null
          updated_at: string
          weight_grams: number
          width_cm: number
        }
        Insert: {
          active?: boolean
          allow_direct_purchase?: boolean
          category?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          height_cm?: number
          id?: string
          image_url?: string | null
          length_cm?: number
          name: string
          price?: number
          price_display?: string
          stripe_price_id?: string | null
          updated_at?: string
          weight_grams?: number
          width_cm?: number
        }
        Update: {
          active?: boolean
          allow_direct_purchase?: boolean
          category?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          height_cm?: number
          id?: string
          image_url?: string | null
          length_cm?: number
          name?: string
          price?: number
          price_display?: string
          stripe_price_id?: string | null
          updated_at?: string
          weight_grams?: number
          width_cm?: number
        }
        Relationships: []
      }
      shopping_list: {
        Row: {
          category: string | null
          created_at: string
          display_order: number
          done: boolean
          id: string
          name: string
          notes: string | null
          quantity: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          display_order?: number
          done?: boolean
          id?: string
          name: string
          notes?: string | null
          quantity?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          display_order?: number
          done?: boolean
          id?: string
          name?: string
          notes?: string | null
          quantity?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_media: {
        Row: {
          key: string
          label: string
          meta: Json
          page: string
          type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          key: string
          label: string
          meta?: Json
          page: string
          type: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          key?: string
          label?: string
          meta?: Json
          page?: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          id: string
          name: string
          rating: number
          text: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          name: string
          rating?: number
          text: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          rating?: number
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      os_public: {
        Row: {
          client_name: string | null
          created_at: string | null
          end_date: string | null
          endereco: string | null
          id: string | null
          notes: string | null
          payment_method: string | null
          produto: string | null
          scheduled_date: string | null
          status: string | null
          tipo: string | null
          title: string | null
          valor: number | null
        }
        Insert: {
          client_name?: string | null
          created_at?: string | null
          end_date?: string | null
          endereco?: string | null
          id?: string | null
          notes?: string | null
          payment_method?: string | null
          produto?: string | null
          scheduled_date?: string | null
          status?: string | null
          tipo?: string | null
          title?: string | null
          valor?: number | null
        }
        Update: {
          client_name?: string | null
          created_at?: string | null
          end_date?: string | null
          endereco?: string | null
          id?: string | null
          notes?: string | null
          payment_method?: string | null
          produto?: string | null
          scheduled_date?: string | null
          status?: string | null
          tipo?: string | null
          title?: string | null
          valor?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_business_days: {
        Args: { days: number; start_date: string }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      normalize_email: { Args: { _email: string }; Returns: string }
      normalize_phone: { Args: { _phone: string }; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      validate_coupon: {
        Args: { _code: string }
        Returns: {
          code: string
          discount_percent: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
