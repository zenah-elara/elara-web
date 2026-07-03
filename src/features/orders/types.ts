import type { CartItem } from "@/features/cart/types";
import type { Database } from "@/lib/supabase/types";

export type PreferredContactMethod =
  Database["public"]["Tables"]["orders"]["Row"]["preferred_contact_method"];

export type OrderRequestPayload = {
  items: CartItem[];
};

export type SubmitOrderResult = {
  success: boolean;
  message: string;
  orderId?: string;
  orderNumber?: string;
};
