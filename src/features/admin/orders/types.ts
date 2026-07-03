import type { Database } from "@/lib/supabase/types";

export type AdminOrderProductImage =
  Database["public"]["Tables"]["product_images"]["Row"];

export type AdminOrderProductPreview = {
  name: string;
  slug: string;
  stock_quantity: number;
  product_type?: Database["public"]["Tables"]["products"]["Row"]["product_type"];
  finish_type?: Database["public"]["Tables"]["products"]["Row"]["finish_type"];
  product_images?: AdminOrderProductImage[] | null;
} | null;

export type AdminOrder = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items:
    | (Database["public"]["Tables"]["order_items"]["Row"] & {
        products: AdminOrderProductPreview;
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
    custom_necklace_items:
      | (Database["public"]["Tables"]["custom_necklace_items"]["Row"] & {
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
  };
