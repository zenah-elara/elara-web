import type { AdminProduct } from "./types";

type StockProduct = Pick<AdminProduct,
  "has_variants" | "stock_quantity" | "size_length_behavior" |
  "is_size_customizable" | "size_options"
> & {
  product_variants: Pick<NonNullable<AdminProduct["product_variants"]>[number], "id" | "stock_quantity">[] | null;
  product_size_inventory: Pick<NonNullable<AdminProduct["product_size_inventory"]>[number], "variant_id" | "stock_quantity">[] | null;
};

export function getAdminProductStockTotal(product: StockProduct): number {
  const usesPresetSizes = product.size_length_behavior === "preset" ||
    product.size_length_behavior === "preset_and_custom" ||
    (product.size_length_behavior === "none" && product.is_size_customizable &&
      Boolean(product.size_options?.length));

  if (usesPresetSizes) {
    const variantIds = new Set(product.product_variants?.map((variant) => variant.id));
    return (product.product_size_inventory ?? [])
      .filter((row) => product.has_variants
        ? row.variant_id !== null && variantIds.has(row.variant_id)
        : row.variant_id === null)
      .reduce((total, row) => total + row.stock_quantity, 0);
  }

  if (product.has_variants) {
    return (product.product_variants ?? [])
      .reduce((total, variant) => total + variant.stock_quantity, 0);
  }

  return product.stock_quantity;
}
