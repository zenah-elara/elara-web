"use client";

import { useMemo, useState } from "react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { CartInput } from "@/features/cart/types";

type ProductPurchaseOptionsProps = {
  item: Omit<CartInput, "selectedSize" | "sizeLabel">;
  isSizeCustomizable?: boolean;
  sizeOptions?: string[];
  sizeLabel?: string | null;
  fixedSizeNote?: string | null;
};

export function ProductPurchaseOptions({
  item,
  isSizeCustomizable = false,
  sizeOptions = [],
  sizeLabel,
  fixedSizeNote,
}: ProductPurchaseOptionsProps) {
  const availableOptions = useMemo(
    () => sizeOptions.map((option) => option.trim()).filter(Boolean),
    [sizeOptions],
  );
  const requiresSelection = isSizeCustomizable && availableOptions.length > 0;
  const label = sizeLabel || "Size";
  const [selectedSize, setSelectedSize] = useState(
    requiresSelection && availableOptions.length === 1 ? availableOptions[0] : "",
  );

  return (
    <div className="space-y-4">
      {requiresSelection ? (
        <label className="block">
          <span className="text-sm font-semibold text-[#7A3F63]">{label}</span>
          <select
            value={selectedSize}
            onChange={(event) => setSelectedSize(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm font-semibold text-[#7A3F63] outline-none"
          >
            <option value="" disabled>
              Choose {label.toLowerCase()}
            </option>
            {availableOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : fixedSizeNote ? (
        <div className="rounded-2xl border border-[#efccd4] bg-[#fff7fa] p-4 text-sm leading-6 text-[#76504a]">
          <span className="font-semibold text-[#7A3F63]">Size note: </span>
          {fixedSizeNote}
        </div>
      ) : null}
      <AddToCartButton
        item={{
          ...item,
          cartItemId: `${item.productId}${selectedSize ? `-${selectedSize}` : ""}`,
          selectedSize: selectedSize || null,
          sizeLabel: requiresSelection ? label : null,
        }}
        disabled={requiresSelection && !selectedSize}
        className="min-h-11 w-full px-5"
        label={
          requiresSelection && !selectedSize
            ? `Choose ${label.toLowerCase()}`
            : "Add to Cart"
        }
      />
    </div>
  );
}
