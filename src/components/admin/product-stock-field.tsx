"use client";

import { useEffect, useState } from "react";
import { useProductVariantMode } from "@/components/admin/product-variant-form-context";

export function ProductStockField({
  defaultStock = 0,
  defaultUsesPresetSizes = false,
}: {
  defaultStock?: number;
  defaultUsesPresetSizes?: boolean;
}) {
  const { hasVariants } = useProductVariantMode();
  const [usesPresetSizes, setUsesPresetSizes] = useState(defaultUsesPresetSizes);

  useEffect(() => {
    function handleSizeChange(event: Event) {
      const behavior = (event as CustomEvent<{ behavior: string }>).detail.behavior;
      setUsesPresetSizes(behavior === "preset" || behavior === "preset_and_custom");
    }
    window.addEventListener("elara:size-inventory-change", handleSizeChange);
    return () => window.removeEventListener("elara:size-inventory-change", handleSizeChange);
  }, []);

  if (hasVariants || usesPresetSizes) return null;

  return (
    <label className="block">
      <span className="text-sm font-semibold text-cocoa">Stock quantity</span>
      <input name="stock_quantity" type="number" min="0" step="1" defaultValue={defaultStock || ""} placeholder="0" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
    </label>
  );
}
