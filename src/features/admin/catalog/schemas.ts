import type { Database } from "@/lib/supabase/types";
import type { ProductType } from "./types";

type CollectionInsert = Database["public"]["Tables"]["collections"]["Insert"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function requiredText(formData: FormData, key: string) {
  const value = textValue(formData, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const raw = String(formData.get(key) ?? "").trim();

  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function booleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

const productTypes: ProductType[] = [
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

const finishTypes = ["gold_plated", "stainless_steel"] as const;
const builderPriceTiers = ["basic", "premium"] as const;
const sizeLengthBehaviors = [
  "none",
  "preset",
  "custom",
  "preset_and_custom",
] as const;

function finishTypeValue(formData: FormData) {
  const finishType = textValue(formData, "finish_type");

  if (!finishType) {
    return null;
  }

  if (finishType === "non_tarnish") {
    return "stainless_steel";
  }

  if (!finishTypes.includes(finishType as (typeof finishTypes)[number])) {
    throw new Error("finish_type is invalid.");
  }

  return finishType as (typeof finishTypes)[number];
}

function builderPriceTierValue(formData: FormData) {
  const tier = textValue(formData, "builder_price_tier") ?? "basic";

  if (!builderPriceTiers.includes(tier as (typeof builderPriceTiers)[number])) {
    throw new Error("builder_price_tier is invalid.");
  }

  return tier as (typeof builderPriceTiers)[number];
}

function sizeLengthBehaviorValue(formData: FormData) {
  const behavior = textValue(formData, "size_length_behavior") ?? "none";

  if (
    !sizeLengthBehaviors.includes(
      behavior as (typeof sizeLengthBehaviors)[number],
    )
  ) {
    throw new Error("size_length_behavior is invalid.");
  }

  return behavior as (typeof sizeLengthBehaviors)[number];
}

function listValue(formData: FormData, key: string) {
  const values = String(formData.get(key) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return values.length > 0 ? values : null;
}

export function parseCollectionFormData(formData: FormData): CollectionInsert {
  const name = requiredText(formData, "name");
  const slug = textValue(formData, "slug") ?? slugify(name);

  if (!slug) {
    throw new Error("slug is required.");
  }

  return {
    name,
    slug,
    description: textValue(formData, "description"),
    sort_order: numberValue(formData, "sort_order"),
    is_active: booleanValue(formData, "is_active"),
    image_alt_text: textValue(formData, "image_alt_text"),
  };
}

export function parseProductFormData(formData: FormData): ProductInsert {
  const name = requiredText(formData, "name");
  const slug = textValue(formData, "slug") ?? slugify(name);
  const productType = String(formData.get("product_type") ?? "");

  if (!slug) {
    throw new Error("slug is required.");
  }

  if (!productTypes.includes(productType as ProductType)) {
    throw new Error("product_type is invalid.");
  }

  const sizeLengthBehavior = sizeLengthBehaviorValue(formData);
  const usesPresetSizes =
    sizeLengthBehavior === "preset" ||
    sizeLengthBehavior === "preset_and_custom";
  const usesCustomLength =
    sizeLengthBehavior === "custom" ||
    sizeLengthBehavior === "preset_and_custom";
  const sizeOptions = usesPresetSizes
    ? listValue(formData, "size_options")
    : null;

  if (usesPresetSizes && !sizeOptions?.length) {
    throw new Error("Preset size choices are required.");
  }

  if (usesCustomLength && !textValue(formData, "custom_length_label")) {
    throw new Error("Custom length label is required.");
  }

  return {
    name,
    slug,
    description: textValue(formData, "description"),
    price: numberValue(formData, "price"),
    collection_id: textValue(formData, "collection_id"),
    product_type: productType as ProductType,
    finish_type: finishTypeValue(formData),
    finish_notes: textValue(formData, "finish_notes"),
    builder_price_tier: builderPriceTierValue(formData),
    is_size_customizable: usesPresetSizes,
    size_length_behavior: sizeLengthBehavior,
    size_label: usesPresetSizes ? textValue(formData, "size_label") : null,
    size_options: sizeOptions,
    custom_length_label: usesCustomLength
      ? textValue(formData, "custom_length_label")
      : null,
    custom_length_help_text: usesCustomLength
      ? textValue(formData, "custom_length_help_text")
      : null,
    fixed_size_note: textValue(formData, "fixed_size_note"),
    sku: textValue(formData, "sku"),
    material_details: textValue(formData, "material_details"),
    care_instructions: textValue(formData, "care_instructions"),
    stock_quantity: numberValue(formData, "stock_quantity"),
    low_stock_threshold: numberValue(formData, "low_stock_threshold", 3),
    is_active: booleanValue(formData, "is_active"),
    is_featured: booleanValue(formData, "is_featured"),
    is_new_arrival: booleanValue(formData, "is_new_arrival"),
    sort_order: numberValue(formData, "sort_order"),
  };
}

export function parseTags(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
