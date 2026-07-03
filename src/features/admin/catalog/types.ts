import type { Database } from "@/lib/supabase/types";

export type ProductType =
  Database["public"]["Tables"]["products"]["Row"]["product_type"];

export const productTypes: ProductType[] = [
  "regular_product",
  "necklace",
  "bracelet",
  "ring",
  "chain",
  "charm",
  "mini_charm",
  "pendant",
  "connector",
  "custom_necklace",
];

export const adminProductTypeGroups: {
  label: string;
  options: {
    value: ProductType;
    label: string;
    helper: string;
  }[];
}[] = [
  {
    label: "Regular Collection / Shop",
    options: [
      {
        value: "regular_product",
        label: "Regular product — Collection / Shop",
        helper:
          "This is a Regular Collection / Shop product. If active and in stock, it can appear in public Collections.",
      },
      {
        value: "necklace",
        label: "Necklace — Collection / Shop",
        helper:
          "This is a Regular Collection / Shop product. If active and in stock, it can appear in public Collections.",
      },
      {
        value: "bracelet",
        label: "Bracelet — Collection / Shop",
        helper:
          "This is a Regular Collection / Shop product. If active and in stock, it can appear in public Collections.",
      },
      {
        value: "ring",
        label: "Ring — Collection / Shop",
        helper:
          "This is a Regular Collection / Shop product. If active and in stock, it can appear in public Collections.",
      },
    ],
  },
  {
    label: "Build Your Elara Piece",
    options: [
      {
        value: "chain",
        label: "Chain — Build Your Elara Piece",
        helper:
          "This is for Build Your Elara Piece. Choose Basic or Premium chain tier. Chains do not appear as regular products in public Collections.",
      },
      {
        value: "charm",
        label: "Main charm — Build Your Elara Piece",
        helper:
          "This is a main charm for Build Your Elara Piece. It is included in the base necklace price. Builder price tier is ignored and can stay Basic.",
      },
      {
        value: "mini_charm",
        label: "Mini charm — Build Your Elara Piece",
        helper:
          "This is a mini charm for Build Your Elara Piece. Choose Basic or Premium mini charm tier.",
      },
      {
        value: "connector",
        label: "Connector — Build Your Elara Piece",
        helper:
          "This is a connector for Build Your Elara Piece. Connector add-on price is fixed at ₱39. Builder price tier is ignored and can stay Basic.",
      },
    ],
  },
];

export const selectableAdminProductTypes = adminProductTypeGroups.flatMap(
  (group) => group.options.map((option) => option.value),
);

export type AdminCollection =
  Database["public"]["Tables"]["collections"]["Row"] & {
    products_count?: number;
  };

export type AdminProduct = Database["public"]["Tables"]["products"]["Row"] & {
  collections: {
    id: string;
    name: string;
    slug: string;
  } | null;
  product_images: Database["public"]["Tables"]["product_images"]["Row"][] | null;
  product_tags: Database["public"]["Tables"]["product_tags"]["Row"][] | null;
};

export type AdminProductFilters = {
  status?: "all" | "active" | "inactive";
  productType?: ProductType | "all";
  collectionId?: string | "all";
  lowStock?: boolean;
};

export type AdminActionState = {
  success: boolean;
  message: string;
};
