"use client";

import { useEffect, useMemo, useState } from "react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { CartInput } from "@/features/cart/types";
import type { ProductVariant } from "@/lib/data";

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
  variants?: ProductVariant[];
  onVariantChange?: (variant: ProductVariant | null) => void;
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
  variants = [],
  onVariantChange,
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
  const finishOptions = useMemo(
    () => [...new Set(variants.map((variant) => variant.finish).filter((value): value is string => Boolean(value)))],
    [variants],
  );
  const colorOptions = useMemo(
    () => [...new Set(variants.map((variant) => variant.color).filter((value): value is string => Boolean(value)))],
    [variants],
  );
  const [selectedFinish, setSelectedFinish] = useState(finishOptions.length === 1 ? finishOptions[0] : "");
  const [selectedColor, setSelectedColor] = useState(colorOptions.length === 1 ? colorOptions[0] : "");
  const selectedVariant = variants.find(
    (variant) =>
      (!variant.finish || variant.finish === selectedFinish) &&
      (!variant.color || variant.color === selectedColor),
  ) ?? null;

  useEffect(() => {
    onVariantChange?.(selectedVariant);
  }, [onVariantChange, selectedVariant]);
  const trimmedCustomLength = customLength.trim();
  const isMissingRequiredValue =
    (requiresPreset && !selectedSize) ||
    (requiresCustomLength && !trimmedCustomLength) ||
    (finishOptions.length > 0 && !selectedFinish) ||
    (colorOptions.length > 0 && !selectedColor) ||
    (variants.length > 0 && (!selectedVariant || selectedVariant.stock <= 0));

  return (
    <div className="space-y-4">
      {finishOptions.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-[#7A3F63]">Finish</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {finishOptions.map((finish) => (
              <button key={finish} type="button" onClick={() => setSelectedFinish(finish)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${selectedFinish === finish ? "border-[#d38aa0] bg-[#d38aa0] text-white" : "border-[#efccd4] bg-[#fffaf8] text-[#7A3F63]"}`}>
                {finish}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {colorOptions.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-[#7A3F63]">Color</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {colorOptions.map((color) => (
              <button key={color} type="button" onClick={() => setSelectedColor(color)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${selectedColor === color ? "border-[#d38aa0] bg-[#d38aa0] text-white" : "border-[#efccd4] bg-[#fffaf8] text-[#7A3F63]"}`}>
                {color}
              </button>
            ))}
          </div>
        </div>
      ) : null}
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
          variantId: selectedVariant?.id ?? null,
          selectedFinish: selectedVariant?.finish ?? null,
          selectedColor: selectedVariant?.color ?? null,
          unitPrice: selectedVariant?.priceOverride ?? item.unitPrice,
          stockQuantity: selectedVariant?.stock ?? item.stockQuantity,
          finishType: selectedVariant?.materialTypeOverride ?? item.finishType,
          imageUrl: selectedVariant?.images[0]?.imageUrl ?? item.imageUrl,
          cartItemId: `${item.productId}${selectedVariant ? `-${selectedVariant.id}` : ""}${selectedSize ? `-${selectedSize}` : ""}${
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
          finishOptions.length > 0 && !selectedFinish
            ? "Choose a finish"
            : colorOptions.length > 0 && !selectedColor
              ? "Choose a color"
              : variants.length > 0 && !selectedVariant
                ? "Combination unavailable"
                : variants.length > 0 && selectedVariant?.stock === 0
                  ? "Out of stock"
                  : requiresPreset && !selectedSize
                    ? `Choose ${label.toLowerCase()}`
                    : requiresCustomLength && !trimmedCustomLength
                      ? "Enter preferred length"
                      : "Add to Cart"
        }
      />
    </div>
  );
}
