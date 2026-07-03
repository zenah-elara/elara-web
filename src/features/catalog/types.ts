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
  size_options: string[] | null;
  size_label: string | null;
  fixed_size_note: string | null;
  builder_price_tier: CatalogProduct["builderPriceTier"] | null;
  stock_quantity: number;
  low_stock_threshold: number | null;
  is_featured: boolean | null;
  is_new_arrival: boolean | null;
  collections: {
    name: string;
    slug: string;
  } | null;
  product_images:
    | {
        image_url: string;
        alt_text: string | null;
        is_primary: boolean | null;
        sort_order: number | null;
        id?: string;
      }[]
    | null;
  product_tags:
    | {
        tag: string;
      }[]
    | null;
};
