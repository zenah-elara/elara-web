"use client";

import { useMemo, useState } from "react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { CartInput } from "@/features/cart/types";

type ProductPurchaseOptionsProps = {
  item: Omit<
    CartInput,
    "selectedSize" | "sizeLabel" | "customLength" | "customLengthLabel"
  >;
  sizeLengthBehavior?:
    | "none"
    | "preset"
    | "custom"
    | "preset_and_custom";
  isSizeCustomizable?: boolean;
  sizeOptions?: string[];
  sizeLabel?: string | null;
  customLengthLabel?: string | null;
  customLengthHelpText?: string | null;
  fixedSizeNote?: string | null;
};

export function ProductPurchaseOptions({
  item,
  sizeLengthBehavior,
  isSizeCustomizable = false,
  sizeOptions = [],
  sizeLabel,
  customLengthLabel,
  customLengthHelpText,
  fixedSizeNote,
}: ProductPurchaseOptionsProps) {
  const availableOptions = useMemo(
    () => sizeOptions.map((option) => option.trim()).filter(Boolean),
    [sizeOptions],
  );
  const behavior =
    sizeLengthBehavior && sizeLengthBehavior !== "none"
      ? sizeLengthBehavior
      : isSizeCustomizable && availableOptions.length > 0
        ? "preset"
        : "none";
  const requiresPreset =
    behavior === "preset" || behavior === "preset_and_custom";
  const requiresCustomLength =
    behavior === "custom" || behavior === "preset_and_custom";
  const label = sizeLabel || "Size";
  const requestedLengthLabel = customLengthLabel || "Custom length";
  const [selectedSize, setSelectedSize] = useState(
    requiresPreset && availableOptions.length === 1 ? availableOptions[0] : "",
  );
  const [customLength, setCustomLength] = useState("");
  const trimmedCustomLength = customLength.trim();
  const isMissingRequiredValue =
    (requiresPreset && !selectedSize) ||
    (requiresCustomLength && !trimmedCustomLength);

  return (
    <div className="space-y-4">
      {requiresPreset ? (
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
      ) : null}
      {requiresCustomLength ? (
        <label className="block">
          <span className="text-sm font-semibold text-[#7A3F63]">
            {requestedLengthLabel}
          </span>
          <input
            type="text"
            value={customLength}
            maxLength={80}
            onChange={(event) => setCustomLength(event.target.value)}
            placeholder="e.g. 6.5 inches, 16 inches, adjustable"
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm font-semibold text-[#7A3F63] outline-none"
          />
          <span className="mt-2 block text-xs leading-5 text-[#76504a]">
            {customLengthHelpText ||
              "Enter your preferred length. We’ll confirm availability through message if needed."}
          </span>
        </label>
      ) : null}
      {behavior === "none" && fixedSizeNote ? (
        <div className="rounded-2xl border border-[#efccd4] bg-[#fff7fa] p-4 text-sm leading-6 text-[#76504a]">
          <span className="font-semibold text-[#7A3F63]">Size note: </span>
          {fixedSizeNote}
        </div>
      ) : null}
      <AddToCartButton
        item={{
          ...item,
          cartItemId: `${item.productId}${selectedSize ? `-${selectedSize}` : ""}${
            trimmedCustomLength ? `-${trimmedCustomLength}` : ""
          }`,
          selectedSize: selectedSize || null,
          sizeLabel: requiresPreset ? label : null,
          customLength: trimmedCustomLength || null,
          customLengthLabel: requiresCustomLength
            ? requestedLengthLabel
            : null,
        }}
        disabled={isMissingRequiredValue}
        className="min-h-11 w-full px-5"
        label={
          requiresPreset && !selectedSize
            ? `Choose ${label.toLowerCase()}`
            : requiresCustomLength && !trimmedCustomLength
              ? "Enter preferred length"
            : "Add to Cart"
        }
      />
    </div>
  );
}
