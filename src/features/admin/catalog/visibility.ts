import type { AdminProduct } from "./types";

const builderTypes = new Set(["chain", "charm", "mini_charm", "connector", "pendant"]);

export function getAdminProductVisibility(product: AdminProduct) {
  if (!product.is_active) {
    return { visible: false, reason: "Product is inactive" };
  }
  if (builderTypes.has(product.product_type)) {
    return { visible: true, reason: "Available in Build Your Elara Piece" };
  }
  if (!product.is_published) {
    return { visible: false, reason: "Product is Draft" };
  }
  if (product.collections && !product.collections.is_published) {
    return { visible: false, reason: `${product.collections.name} is Draft` };
  }
  return { visible: true, reason: "Visible to customers" };
}
