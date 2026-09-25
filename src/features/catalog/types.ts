import type { Collection, Product } from "@/lib/data";

export type CatalogCollection = Collection;

export type CatalogProduct = Product & {
  productType?:
    | "regular_product"
    | "necklace"
    | "ring"
    | "chain"
    | "charm"
    | "mini_charm"
    | "pendant"
    | "connector"
    | "bracelet"
    | "custom_necklace";
};

export type ProductWithRelations = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  product_type: CatalogProduct["productType"];
  material_details: string | null;
  care_instructions: string | null;
  finish_type: CatalogProduct["finishType"];
  finish_notes: string | null;
  is_size_customizable: boolean | null;
  size_length_behavior:
    | "none"
    | "preset"
    | "custom"
    | "preset_and_custom"
    | null;
  size_options: string[] | null;
  size_label: string | null;
  custom_length_label: string | null;
  custom_length_help_text: string | null;
  fixed_size_note: string | null;
  builder_price_tier: CatalogProduct["builderPriceTier"] | null;
  stock_quantity: number;
  low_stock_threshold: number | null;
  has_variants: boolean;
  is_featured: boolean | null;
  is_new_arrival: boolean | null;
  collections: {
    name: string;
    slug: string;
    is_published: boolean;
  } | null;
  product_variants:
    | {
        id: string;
        finish: string | null;
        color: string | null;
        stock_quantity: number;
        price_override: number | string | null;
        material_type_override: "gold_plated" | "stainless_steel" | null;
        is_active: boolean;
        sort_order: number;
        product_images:
          | {
              id?: string;
              image_url: string;
              alt_text: string | null;
              is_primary: boolean | null;
              sort_order: number | null;
            }[]
          | null;
      }[]
    | null;
  product_images:
    | {
        image_url: string;
        alt_text: string | null;
        is_primary: boolean | null;
        sort_order: number | null;
        id?: string;
        variant_id?: string | null;
      }[]
    | null;
  product_tags:
    | {
        tag: string;
      }[]
    | null;
};
