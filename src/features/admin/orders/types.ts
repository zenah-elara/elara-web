import type { Database } from "@/lib/supabase/types";

export type AdminOrderProductImage =
  Database["public"]["Tables"]["product_images"]["Row"];

export type AdminOrderProductPreview = {
  name: string;
  slug: string;
  stock_quantity: number;
  has_variants?: boolean;
  size_length_behavior?: "none" | "preset" | "custom" | "preset_and_custom";
  is_size_customizable?: boolean;
  size_options?: string[] | null;
  product_size_inventory?: {
    id: string;
    variant_id: string | null;
    size_label: string;
    stock_quantity: number;
  }[] | null;
  product_type?: Database["public"]["Tables"]["products"]["Row"]["product_type"];
  finish_type?: Database["public"]["Tables"]["products"]["Row"]["finish_type"];
  product_images?: AdminOrderProductImage[] | null;
} | null;

export type AdminOrder = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items:
    | (Database["public"]["Tables"]["order_items"]["Row"] & {
        products: AdminOrderProductPreview;
        product_variants: {
          material_type_override: "gold_plated" | "stainless_steel" | null;
          product_images: AdminOrderProductImage[] | null;
        } | null;
        custom_necklace_items:
          | (Database["public"]["Tables"]["custom_necklace_items"]["Row"] & {
              custom_necklace_charms:
                | Database["public"]["Tables"]["custom_necklace_charms"]["Row"][]
                | null;
            })[]
          | null;
      })[]
    | null;
};

export type AdminOrderItem =
  Database["public"]["Tables"]["order_items"]["Row"] & {
    products: AdminOrderProductPreview;
    product_variants: {
      stock_quantity?: number;
      is_active?: boolean;
      material_type_override: "gold_plated" | "stainless_steel" | null;
      product_images: AdminOrderProductImage[] | null;
    } | null;
    custom_necklace_items:
      | (Database["public"]["Tables"]["custom_necklace_items"]["Row"] & {
          products?: AdminOrderProductPreview;
          custom_necklace_charms:
            | (Database["public"]["Tables"]["custom_necklace_charms"]["Row"] & {
                products: AdminOrderProductPreview;
              })[]
            | null;
        })[]
      | null;
  };

export type AdminOrderDetail =
  Database["public"]["Tables"]["orders"]["Row"] & {
    order_items: AdminOrderItem[] | null;
  };

export type AdminInventoryMovement =
  Database["public"]["Tables"]["inventory_movements"]["Row"] & {
    products: {
      name: string;
      slug: string;
    } | null;
    orders: {
      order_number: string;
    } | null;
    product_size_inventory: {
      size_label: string;
    } | null;
  };
