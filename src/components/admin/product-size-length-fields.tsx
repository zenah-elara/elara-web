"use client";

import { useEffect, useState } from "react";
import { useProductVariantMode } from "@/components/admin/product-variant-form-context";
import type { ProductType } from "@/features/admin/catalog/types";

export type SizeLengthBehavior =
  | "none"
  | "preset"
  | "custom"
  | "preset_and_custom";

type ProductSizeLengthFieldsProps = {
  defaultProductType?: ProductType;
  defaultBehavior?: SizeLengthBehavior | null;
  defaultIsSizeCustomizable?: boolean;
  defaultSizeLabel?: string | null;
  defaultSizeOptions?: string[] | null;
  defaultFixedSizeNote?: string | null;
  defaultCustomLengthLabel?: string | null;
  defaultCustomLengthHelpText?: string | null;
  defaultSizeInventory?: { id: string; size_label: string; stock_quantity: number }[];
};

const defaultCustomHelp =
  "Customers can request their preferred length. Final availability may still be confirmed through message.";

function inferInitialBehavior({
  behavior,
  isSizeCustomizable,
  sizeOptions,
}: {
  behavior?: SizeLengthBehavior | null;
  isSizeCustomizable?: boolean;
  sizeOptions?: string[] | null;
}): SizeLengthBehavior {
  if (behavior && behavior !== "none") return behavior;
  if (isSizeCustomizable && sizeOptions?.length) return "preset";
  return behavior ?? "none";
}

export function ProductSizeLengthFields({
  defaultProductType = "regular_product",
  defaultBehavior,
  defaultIsSizeCustomizable = false,
  defaultSizeLabel,
  defaultSizeOptions,
  defaultFixedSizeNote,
  defaultCustomLengthLabel,
  defaultCustomLengthHelpText,
  defaultSizeInventory = [],
}: ProductSizeLengthFieldsProps) {
  const { hasVariants } = useProductVariantMode();
  const [productType, setProductType] =
    useState<ProductType>(defaultProductType);
  const [behavior, setBehavior] = useState<SizeLengthBehavior>(() =>
    inferInitialBehavior({
      behavior: defaultBehavior,
      isSizeCustomizable: defaultIsSizeCustomizable,
      sizeOptions: defaultSizeOptions,
    }),
  );
  const [sizeLabel, setSizeLabel] = useState(defaultSizeLabel ?? "");
  const [sizeOptions, setSizeOptions] = useState(
    (defaultSizeOptions ?? []).join(", "),
  );
  const [customLengthLabel, setCustomLengthLabel] = useState(
    defaultCustomLengthLabel ?? "",
  );
  const [customLengthHelpText, setCustomLengthHelpText] = useState(
    defaultCustomLengthHelpText ?? defaultCustomHelp,
  );
  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>(
    Object.fromEntries(defaultSizeInventory.map((row) => [row.size_label, row.stock_quantity])),
  );
  const usesPresets = behavior === "preset" || behavior === "preset_and_custom";
  const usesCustomLength =
    behavior === "custom" || behavior === "preset_and_custom";
  const presetOptions = sizeOptions.split(",").map((value) => value.trim()).filter(Boolean);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("elara:size-inventory-change", {
      detail: {
        behavior,
        options: sizeOptions.split(",").map((value) => value.trim()).filter(Boolean),
      },
    }));
  }, [behavior, sizeOptions]);

  useEffect(() => {
    function handleProductTypeChange(event: Event) {
      const nextType = (event as CustomEvent<{ productType: ProductType }>).detail
        .productType;

      setProductType(nextType);

      if (nextType === "ring") {
        setBehavior("preset");
        setSizeLabel("Ring size");
        setSizeOptions("5, 6, 7, 8, 9");
        setCustomLengthLabel("");
      } else if (nextType === "bracelet") {
        setBehavior("custom");
        setCustomLengthLabel("Bracelet length");
      } else if (nextType === "necklace") {
        setBehavior("custom");
        setCustomLengthLabel("Necklace length");
      } else if (nextType === "chain") {
        setBehavior("preset");
        setSizeLabel("Chain length");
      } else {
        setBehavior("none");
      }
    }

    window.addEventListener("elara:product-type-change", handleProductTypeChange);
    return () =>
      window.removeEventListener(
        "elara:product-type-change",
        handleProductTypeChange,
      );
  }, []);

  const presetPlaceholder =
    productType === "ring"
      ? "5, 6, 7, 8, 9"
      : productType === "necklace" || productType === "chain"
        ? "16 inches, 18 inches, 20 inches"
        : "Small, Medium, Large";
  const customPlaceholder =
    productType === "bracelet"
      ? "Bracelet length"
      : productType === "necklace"
        ? "Necklace length"
        : "Custom length";

  return (
    <section className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-5">
      <p className="text-sm font-semibold text-cocoa">Size / Length</p>
      <p className="mt-2 text-xs leading-5 text-[#76504a]">
        Choose whether customers select from fixed options, enter a requested
        length, use both, or make no selection.
      </p>

      <label className="mt-4 block">
        <span className="text-sm font-semibold text-cocoa">
          Size / length behavior
        </span>
        <select
          name="size_length_behavior"
          value={behavior}
          onChange={(event) =>
            setBehavior(event.target.value as SizeLengthBehavior)
          }
          className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-cocoa outline-none"
        >
          <option value="none">No size or length selection</option>
          <option value="preset">Preset size choices</option>
          <option value="custom">Custom length input</option>
          <option value="preset_and_custom">
            Preset choices + custom length input
          </option>
        </select>
      </label>

      {usesPresets ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">
              Preset choice label
            </span>
            <input
              name="size_label"
              value={sizeLabel}
              onChange={(event) => setSizeLabel(event.target.value)}
              placeholder={productType === "ring" ? "Ring size" : "Size or length"}
              required
              className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-cocoa outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">
              Preset choices
            </span>
            <input
              name="size_options"
              value={sizeOptions}
              onChange={(event) => setSizeOptions(event.target.value)}
              placeholder={presetPlaceholder}
              required
              className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-cocoa outline-none"
            />
            <span className="mt-2 block text-xs leading-5 text-[#76504a]">
              Use preset choices for ring sizes or fixed size options customers
              must choose from. Separate options with commas.
            </span>
          </label>
        </div>
      ) : null}

      {usesPresets && !hasVariants && presetOptions.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-[#efccd4] bg-white p-4">
          <p className="text-sm font-semibold text-[#7A3F63]">Stock by size</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {presetOptions.map((option) => (
              <label key={option} className="text-xs font-semibold text-[#76504a]">
                Size {option}
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={sizeStocks[option] || ""}
                  onChange={(event) => setSizeStocks((current) => ({
                    ...current,
                    [option]: event.target.value === "" ? 0 : Math.max(0, Math.floor(Number(event.target.value))),
                  }))}
                  className="mt-1 w-full rounded-xl border border-[#efccd4] px-3 py-2"
                />
              </label>
            ))}
          </div>
          <input
            type="hidden"
            name="size_inventory_json"
            value={JSON.stringify(presetOptions.map((option) => ({
              variantClientKey: null,
              sizeLabel: option,
              stockQuantity: sizeStocks[option] ?? 0,
            })))}
          />
        </div>
      ) : null}

      {usesCustomLength ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">
              Custom length label
            </span>
            <input
              name="custom_length_label"
              value={customLengthLabel}
              onChange={(event) => setCustomLengthLabel(event.target.value)}
              placeholder={customPlaceholder}
              required
              className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-cocoa outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">
              Customer help text
            </span>
            <textarea
              name="custom_length_help_text"
              rows={3}
              maxLength={240}
              value={customLengthHelpText}
              onChange={(event) => setCustomLengthHelpText(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-cocoa outline-none"
            />
          </label>
        </div>
      ) : null}

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-cocoa">
          Fixed size note (optional)
        </span>
        <input
          name="fixed_size_note"
          defaultValue={defaultFixedSizeNote ?? ""}
          placeholder="Fixed length, adjustable, or other helpful sizing note."
          className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-cocoa outline-none"
        />
      </label>
    </section>
  );
}
