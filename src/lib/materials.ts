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
    return "Gold-plated pieces can keep their finish for a long time with proper care, but the plating may gradually fade or tarnish over time.";
  }

  if (normalizedType === "stainless_steel") {
    return "Non-tarnish stainless steel is made for long-lasting everyday wear and is waterproof for normal use. It may stay untarnished for years or may not noticeably tarnish at all.";
  }

  return null;
}

export function getMaterialCareInstruction(materialType?: string | null) {
  const normalizedType = normalizeMaterialType(materialType);

  if (normalizedType === "gold_plated") {
    return "Frequent exposure to water, sweat, perfume, alcohol, chlorine, lotions, and other chemicals can make this happen sooner. To help preserve the finish, keep the piece dry when possible and limit contact with these substances.";
  }

  if (normalizedType === "stainless_steel") {
    return "It can be worn around water without the same level of concern as gold-plated jewelry. Over many years of wear, changes in finish can still happen depending on use and exposure. Avoiding harsh chemicals, chlorine, perfume, alcohol, and abrasive cleaners will help keep the piece looking its best.";
  }

  return null;
}

export function getMaterialCareCopy(materialType?: string | null) {
  const note = getMaterialNote(materialType);
  const care = getMaterialCareInstruction(materialType);
  return [note, care].filter(Boolean).join(" ");
}
