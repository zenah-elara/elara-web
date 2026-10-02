import type { ProductWithRelations } from "./types";

type Variant = NonNullable<ProductWithRelations["product_variants"]>[number];
const builderTypes = new Set(["chain", "charm", "pendant", "mini_charm", "connector"]);

export function usesPresetSizeInventory(product: Pick<ProductWithRelations,
  "size_length_behavior" | "is_size_customizable" | "size_options"
>) {
  return product.size_length_behavior === "preset" ||
    product.size_length_behavior === "preset_and_custom" ||
    ((!product.size_length_behavior || product.size_length_behavior === "none") &&
      product.is_size_customizable && Boolean(product.size_options?.length));
}

function sizeTotal(product: ProductWithRelations, variantId: string | null) {
  const options = new Set(product.size_options?.map((size) => size.trim().toLowerCase()));
  const nested = variantId
    ? product.product_variants?.find((variant) => variant.id === variantId)?.product_size_inventory
    : null;
  const rows = nested ?? product.product_size_inventory ?? [];
  return rows.filter((row) => row.variant_id === variantId &&
    options.has(row.size_label.trim().toLowerCase()))
    .reduce((total, row) => total + row.stock_quantity, 0);
}

export function getSellableVariantStock(product: ProductWithRelations, variant: Variant) {
  if (!variant.is_active) return 0;
  if (product.product_type && builderTypes.has(product.product_type)) return variant.stock_quantity;
  return usesPresetSizeInventory(product) ? sizeTotal(product, variant.id) : variant.stock_quantity;
}

export function getSellableProductStock(product: ProductWithRelations) {
  if (product.has_variants) {
    return (product.product_variants ?? [])
      .reduce((total, variant) => total + getSellableVariantStock(product, variant), 0);
  }
  if (product.product_type && builderTypes.has(product.product_type)) return product.stock_quantity;
  return usesPresetSizeInventory(product) ? sizeTotal(product, null) : product.stock_quantity;
}
