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
      collections: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          sort_order: number | null;
          is_active: boolean | null;
          image_url: string | null;
          image_alt_text: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          sort_order?: number | null;
          is_active?: boolean | null;
          image_url?: string | null;
          image_alt_text?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          sort_order?: number | null;
          is_active?: boolean | null;
          image_url?: string | null;
          image_alt_text?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      site_assets: {
        Row: {
          id: string;
          key: string;
          title: string | null;
          image_url: string | null;
          alt_text: string | null;
          is_active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          title?: string | null;
          image_url?: string | null;
          alt_text?: string | null;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          key?: string;
          title?: string | null;
          image_url?: string | null;
          alt_text?: string | null;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      customized_engraved_requests: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          status:
            | "new"
            | "contacted"
            | "in_discussion"
            | "confirmed"
            | "declined"
            | "completed";
          full_name: string;
          contact_method: string;
          contact_details: string;
          purpose_or_occasion: string | null;
          piece_type: string;
          pendant_shape: string | null;
          chain_option: string | null;
          quantity: string;
          customization_type: string;
          engraving_text: string | null;
          font_preference: string | null;
          design_reference_link: string | null;
          needed_by_date: string;
          delivery_or_pickup_location: string | null;
          additional_notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?:
            | "new"
            | "contacted"
            | "in_discussion"
            | "confirmed"
            | "declined"
            | "completed";
          full_name: string;
          contact_method: string;
          contact_details: string;
          purpose_or_occasion?: string | null;
          piece_type: string;
          pendant_shape?: string | null;
          chain_option?: string | null;
          quantity: string;
          customization_type: string;
          engraving_text?: string | null;
          font_preference?: string | null;
          design_reference_link?: string | null;
          needed_by_date: string;
          delivery_or_pickup_location?: string | null;
          additional_notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?:
            | "new"
            | "contacted"
            | "in_discussion"
            | "confirmed"
            | "declined"
            | "completed";
          full_name?: string;
          contact_method?: string;
          contact_details?: string;
          purpose_or_occasion?: string | null;
          piece_type?: string;
          pendant_shape?: string | null;
          chain_option?: string | null;
          quantity?: string;
          customization_type?: string;
          engraving_text?: string | null;
          font_preference?: string | null;
          design_reference_link?: string | null;
          needed_by_date?: string;
          delivery_or_pickup_location?: string | null;
          additional_notes?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          collection_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          product_type:
            | "regular_product"
            | "necklace"
            | "bracelet"
            | "ring"
            | "chain"
            | "charm"
            | "mini_charm"
            | "pendant"
            | "connector"
            | "custom_necklace";
          finish_type:
            | "gold_plated"
            | "stainless_steel"
            | "non_tarnish"
            | null;
          finish_notes: string | null;
          is_size_customizable: boolean;
          size_options: string[] | null;
          size_label: string | null;
          fixed_size_note: string | null;
          builder_price_tier: "basic" | "premium";
          sku: string | null;
          material_details: string | null;
          care_instructions: string | null;
          stock_quantity: number;
          low_stock_threshold: number;
          is_active: boolean | null;
          is_featured: boolean | null;
          is_new_arrival: boolean | null;
          sort_order: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          collection_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          price?: number;
          product_type:
            | "regular_product"
            | "necklace"
            | "bracelet"
            | "ring"
            | "chain"
            | "charm"
            | "mini_charm"
            | "pendant"
            | "connector"
            | "custom_necklace";
          finish_type?:
            | "gold_plated"
            | "stainless_steel"
            | "non_tarnish"
            | null;
          finish_notes?: string | null;
          is_size_customizable?: boolean;
          size_options?: string[] | null;
          size_label?: string | null;
          fixed_size_note?: string | null;
          builder_price_tier?: "basic" | "premium";
          sku?: string | null;
          material_details?: string | null;
          care_instructions?: string | null;
          stock_quantity?: number;
          low_stock_threshold?: number;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_new_arrival?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          collection_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          product_type?:
            | "regular_product"
            | "necklace"
            | "bracelet"
            | "ring"
            | "chain"
            | "charm"
            | "mini_charm"
            | "pendant"
            | "connector"
            | "custom_necklace";
          finish_type?:
            | "gold_plated"
            | "stainless_steel"
            | "non_tarnish"
            | null;
          finish_notes?: string | null;
          is_size_customizable?: boolean;
          size_options?: string[] | null;
          size_label?: string | null;
          fixed_size_note?: string | null;
          builder_price_tier?: "basic" | "premium";
          sku?: string | null;
          material_details?: string | null;
          care_instructions?: string | null;
          stock_quantity?: number;
          low_stock_threshold?: number;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_new_arrival?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string | null;
          image_url: string;
          alt_text: string | null;
          sort_order: number | null;
          is_primary: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          image_url: string;
          alt_text?: string | null;
          sort_order?: number | null;
          is_primary?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          image_url?: string;
          alt_text?: string | null;
          sort_order?: number | null;
          is_primary?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      product_tags: {
        Row: {
          id: string;
          product_id: string | null;
          tag: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          tag: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          tag?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_name: string;
          contact_number: string;
          facebook_link: string | null;
          instagram_username: string | null;
          delivery_location: string;
          delivery_method: "bacolod_delivery" | "outside_bacolod_shipping" | "dropoff_store" | null;
          courier_service: "grab_express" | "maxim" | "jnt_express" | null;
          dropoff_location: string | null;
          shipping_address: string | null;
          preferred_contact_method: "facebook" | "instagram" | "phone";
          order_notes: string | null;
          internal_notes: string | null;
          status:
            | "new"
            | "contacted"
            | "confirmed"
            | "paid"
            | "packed"
            | "delivered"
            | "cancelled";
          subtotal: number;
          estimated_total: number;
          stock_deducted_at: string | null;
          confirmed_at: string | null;
          cancelled_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_name: string;
          contact_number: string;
          facebook_link?: string | null;
          instagram_username?: string | null;
          delivery_location: string;
          delivery_method?: "bacolod_delivery" | "outside_bacolod_shipping" | "dropoff_store" | null;
          courier_service?: "grab_express" | "maxim" | "jnt_express" | null;
          dropoff_location?: string | null;
          shipping_address?: string | null;
          preferred_contact_method: "facebook" | "instagram" | "phone";
          order_notes?: string | null;
          internal_notes?: string | null;
          status?:
            | "new"
            | "contacted"
            | "confirmed"
            | "paid"
            | "packed"
            | "delivered"
            | "cancelled";
          subtotal?: number;
          estimated_total?: number;
          stock_deducted_at?: string | null;
          confirmed_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_name?: string;
          contact_number?: string;
          facebook_link?: string | null;
          instagram_username?: string | null;
          delivery_location?: string;
          delivery_method?: "bacolod_delivery" | "outside_bacolod_shipping" | "dropoff_store" | null;
          courier_service?: "grab_express" | "maxim" | "jnt_express" | null;
          dropoff_location?: string | null;
          shipping_address?: string | null;
          preferred_contact_method?: "facebook" | "instagram" | "phone";
          order_notes?: string | null;
          internal_notes?: string | null;
          status?:
            | "new"
            | "contacted"
            | "confirmed"
            | "paid"
            | "packed"
            | "delivered"
            | "cancelled";
          subtotal?: number;
          estimated_total?: number;
          stock_deducted_at?: string | null;
          confirmed_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          product_id: string | null;
          item_type:
            | "regular_product"
            | "custom_necklace"
            | "chain"
            | "charm"
            | "mini_charm"
            | "pendant"
            | "connector"
            | "bracelet";
          item_name: string;
          selected_size: string | null;
          unit_price: number;
          quantity: number;
          line_total: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          item_type?:
            | "regular_product"
            | "custom_necklace"
            | "chain"
            | "charm"
            | "mini_charm"
            | "pendant"
            | "connector"
            | "bracelet";
          item_name: string;
          selected_size?: string | null;
          unit_price?: number;
          quantity?: number;
          line_total?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          item_type?:
            | "regular_product"
            | "custom_necklace"
            | "chain"
            | "charm"
            | "mini_charm"
            | "pendant"
            | "connector"
            | "bracelet";
          item_name?: string;
          selected_size?: string | null;
          unit_price?: number;
          quantity?: number;
          line_total?: number;
          created_at?: string | null;
        };
        Relationships: [];
      };
      custom_necklace_items: {
        Row: {
          id: string;
          order_item_id: string | null;
          chain_product_id: string | null;
          chain_name: string;
          chain_length: string | null;
          chain_price: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_item_id?: string | null;
          chain_product_id?: string | null;
          chain_name: string;
          chain_length?: string | null;
          chain_price?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_item_id?: string | null;
          chain_product_id?: string | null;
          chain_name?: string;
          chain_length?: string | null;
          chain_price?: number;
          created_at?: string | null;
        };
        Relationships: [];
      };
      custom_necklace_charms: {
        Row: {
          id: string;
          custom_necklace_item_id: string | null;
          charm_product_id: string | null;
          charm_name: string;
          charm_price: number;
          product_type: "charm" | "mini_charm" | "pendant" | "connector" | null;
          arrangement_order: number;
          quantity: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          custom_necklace_item_id?: string | null;
          charm_product_id?: string | null;
          charm_name: string;
          charm_price?: number;
          product_type?: "charm" | "mini_charm" | "pendant" | "connector" | null;
          arrangement_order?: number;
          quantity?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          custom_necklace_item_id?: string | null;
          charm_product_id?: string | null;
          charm_name?: string;
          charm_price?: number;
          product_type?: "charm" | "mini_charm" | "pendant" | "connector" | null;
          arrangement_order?: number;
          quantity?: number;
          created_at?: string | null;
        };
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          id: string;
          product_id: string | null;
          order_id: string | null;
          movement_type:
            | "manual_adjustment"
            | "order_confirmed"
            | "order_cancelled_restore"
            | "restock";
          quantity_change: number;
          previous_stock: number;
          new_stock: number;
          reason: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          order_id?: string | null;
          movement_type:
            | "manual_adjustment"
            | "order_confirmed"
            | "order_cancelled_restore"
            | "restock";
          quantity_change: number;
          previous_stock: number;
          new_stock: number;
          reason?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          order_id?: string | null;
          movement_type?:
            | "manual_adjustment"
            | "order_confirmed"
            | "order_cancelled_restore"
            | "restock";
          quantity_change?: number;
          previous_stock?: number;
          new_stock?: number;
          reason?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      admin_profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          role: "owner" | "admin" | "staff";
          display_name: string | null;
          is_active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      update_order_status_inventory: {
        Args: {
          p_order_id: string;
          p_next_status: string;
          p_internal_notes?: string | null;
        };
        Returns: {
          success: boolean;
          message: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
