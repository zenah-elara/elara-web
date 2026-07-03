export type ProductMaterialType =
  | "gold_plated"
  | "stainless_steel"
  | "non_tarnish";

export function normalizeMaterialType(
  materialType?: string | null,
): Exclude<ProductMaterialType, "non_tarnish"> | null {
  if (materialType === "gold_plated") return "gold_plated";
  if (materialType === "stainless_steel" || materialType === "non_tarnish") {
    return "stainless_steel";
  }

  return null;
}

export function getMaterialLabel(materialType?: string | null) {
  const normalizedType = normalizeMaterialType(materialType);

  if (normalizedType === "gold_plated") return "Gold-plated";
  if (normalizedType === "stainless_steel") {
    return "Non-tarnish / Stainless steel";
  }

  return null;
}

export function getMaterialNote(materialType?: string | null) {
  const normalizedType = normalizeMaterialType(materialType);

  if (normalizedType === "gold_plated") {
    return "Gold-plated pieces may tarnish over time, especially with frequent exposure to water, sweat, perfume, alcohol, or other chemicals.";
  }

  if (normalizedType === "stainless_steel") {
    return "Stainless steel is made for long-lasting wear and may take a very long time to tarnish, or may not tarnish even after years of daily use with proper care.";
  }

  return null;
}

export function getMaterialCareInstruction(materialType?: string | null) {
  const normalizedType = normalizeMaterialType(materialType);

  if (normalizedType === "gold_plated") {
    return "To help preserve the finish, avoid wearing while showering or swimming, and be careful with exposure to liquids, perfumes, and chemicals.";
  }

  if (normalizedType === "stainless_steel") {
    return "It can handle water better than plated pieces, but it is still best to avoid frequent exposure to chemicals, perfume, alcohol, chlorine, and harsh cleaners.";
  }

  return null;
}
