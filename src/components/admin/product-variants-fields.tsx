"use client";

import { useEffect, useMemo, useState } from "react";
import { VariantImageUploader } from "@/components/admin/variant-image-uploader";
import { useProductVariantMode } from "@/components/admin/product-variant-form-context";
import { formatPrice } from "@/lib/data";

export type AdminVariantValue = {
  clientKey: string;
  id?: string;
  finish: string | null;
  color: string | null;
  stockQuantity: number;
  priceOverride: number | null;
  materialTypeOverride: "gold_plated" | "stainless_steel" | null;
  isActive: boolean;
  sortOrder: number;
  images?: { id: string; imageUrl: string; altText?: string | null }[];
  sizeInventory?: { id: string; sizeLabel: string; stockQuantity: number }[];
};

function splitOptions(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function combinationKey(finish: string | null, color: string | null) {
  return `${finish ?? ""}::${color ?? ""}`.toLowerCase();
}

function variantLabel(variant: AdminVariantValue) {
  return [variant.finish, variant.color].filter(Boolean).join(" + ") || "Variant";
}

export function ProductVariantsFields({
  defaultVariants = [],
  productId,
  productName = "Product preview",
  basePrice = 0,
  defaultSizeOptions = [],
  defaultSizeBehavior = "none",
}: {
  defaultVariants?: AdminVariantValue[];
  productId?: string;
  productName?: string;
  basePrice?: number;
  defaultSizeOptions?: string[];
  defaultSizeBehavior?: "none" | "preset" | "custom" | "preset_and_custom";
}) {
  const { hasVariants, setHasVariants } = useProductVariantMode();
  const defaultFinishes = [...new Set(defaultVariants.map((v) => v.finish).filter(Boolean))].join(", ");
  const defaultColors = [...new Set(defaultVariants.map((v) => v.color).filter(Boolean))].join(", ");
  const [finishesText, setFinishesText] = useState(defaultFinishes);
  const [colorsText, setColorsText] = useState(defaultColors);
  const [variants, setVariants] = useState(defaultVariants);
  const [presetSizes, setPresetSizes] = useState(defaultSizeOptions);
  const [usesPresetSizes, setUsesPresetSizes] = useState(
    defaultSizeBehavior === "preset" || defaultSizeBehavior === "preset_and_custom",
  );

  useEffect(() => {
    function handleSizeChange(event: Event) {
      const detail = (event as CustomEvent<{ behavior: string; options: string[] }>).detail;
      setUsesPresetSizes(detail.behavior === "preset" || detail.behavior === "preset_and_custom");
      setPresetSizes(detail.options);
    }
    window.addEventListener("elara:size-inventory-change", handleSizeChange);
    return () => window.removeEventListener("elara:size-inventory-change", handleSizeChange);
  }, []);

  const regenerate = (nextFinishesText: string, nextColorsText: string) => {
    const finishes = splitOptions(nextFinishesText);
    const colors = splitOptions(nextColorsText);
    const pairs = finishes.length && colors.length
      ? finishes.flatMap((finish) => colors.map((color) => [finish, color] as const))
      : finishes.length
        ? finishes.map((finish) => [finish, null] as const)
        : colors.map((color) => [null, color] as const);
    const existing = new Map(variants.map((variant) => [combinationKey(variant.finish, variant.color), variant]));

    setVariants(pairs.map(([finish, color], index) => existing.get(combinationKey(finish, color)) ?? {
      clientKey: `new-${index}-${combinationKey(finish, color).replace(/[^a-z0-9]+/g, "-")}`,
      finish,
      color,
      stockQuantity: 0,
      priceOverride: null,
      materialTypeOverride: null,
      isActive: true,
      sortOrder: index,
      images: [],
    }));
  };

  const updateVariant = (clientKey: string, patch: Partial<AdminVariantValue>) => {
    setVariants((current) => current.map((variant) => variant.clientKey === clientKey ? { ...variant, ...patch } : variant));
  };

  const serialized = useMemo(() => hasVariants ? variants.map((variant) => ({
    clientKey: variant.clientKey,
    id: variant.id,
    finish: variant.finish,
    color: variant.color,
    stockQuantity: variant.stockQuantity,
    priceOverride: variant.priceOverride,
    materialTypeOverride: variant.materialTypeOverride,
    isActive: variant.isActive,
    sortOrder: variant.sortOrder,
  })) : [], [hasVariants, variants]);
  const sizeInventorySerialized = useMemo(() =>
    hasVariants && usesPresetSizes
      ? variants.flatMap((variant) => presetSizes.map((sizeLabel) => ({
          variantClientKey: variant.clientKey,
          sizeLabel,
          stockQuantity: variant.sizeInventory?.find((row) => row.sizeLabel === sizeLabel)?.stockQuantity ?? 0,
        })))
      : [],
    [hasVariants, presetSizes, usesPresetSizes, variants],
  );

  return (
    <section className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-5">
      <input type="hidden" name="has_variants" value={hasVariants ? "on" : ""} />
      <input type="hidden" name="variants_json" value={JSON.stringify(serialized)} />
      {hasVariants && usesPresetSizes ? <input type="hidden" name="size_inventory_json" value={JSON.stringify(sizeInventorySerialized)} /> : null}
      <p className="text-base font-semibold text-[#7A3F63]">Does this product have variants?</p>
      <p className="mt-1 text-xs leading-5 text-[#76504a]">
        Choose Yes when the same product comes in different finishes or colors.
      </p>
      <div className="mt-4 inline-flex rounded-full border border-[#efccd4] bg-white p-1">
        {[false, true].map((value) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => setHasVariants(value)}
            className={`min-w-20 rounded-full px-4 py-2 text-sm font-semibold transition ${hasVariants === value ? "bg-[#d38aa0] text-white" : "text-[#7A3F63] hover:bg-[#fff1f6]"}`}
          >
            {value ? "Yes" : "No"}
          </button>
        ))}
      </div>

      {hasVariants ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#7A3F63]">
              Finish options
              <input value={finishesText} onChange={(event) => { setFinishesText(event.target.value); regenerate(event.target.value, colorsText); }} placeholder="Gold, Silver, Rose Gold" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm outline-none" />
              <span className="mt-1 block text-xs font-normal text-[#76504a]">Separate options with commas.</span>
            </label>
            <label className="block text-sm font-semibold text-[#7A3F63]">
              Color options
              <input value={colorsText} onChange={(event) => { setColorsText(event.target.value); regenerate(finishesText, event.target.value); }} placeholder="Clear, Pink, Blue" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm outline-none" />
              <span className="mt-1 block text-xs font-normal text-[#76504a]">Leave blank if color does not vary.</span>
            </label>
          </div>

          {variants.length ? variants.map((variant) => {
            const label = variantLabel(variant);
            return (
              <article key={variant.clientKey} className="rounded-2xl border border-[#efccd4] bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#7A3F63]">{label}</p>
                    <p className="mt-1 text-xs text-[#76504a]">Customer price: {formatPrice(variant.priceOverride ?? basePrice)}</p>
                  </div>
                  <label className="flex items-center gap-2 rounded-full bg-[#fff1f6] px-3 py-2 text-xs font-semibold text-[#7A3F63]">
                    <input type="checkbox" checked={variant.isActive} onChange={(event) => updateVariant(variant.clientKey, { isActive: event.target.checked })} />
                    Active / Available
                  </label>
                </div>
                {!usesPresetSizes ? <label className="mt-4 block max-w-xs text-xs font-semibold text-[#76504a]">
                  Stock
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={variant.stockQuantity === 0 ? "" : variant.stockQuantity}
                    onChange={(event) => {
                      const raw = event.target.value;
                      const parsed = raw === "" ? 0 : Math.floor(Number(raw));
                      updateVariant(variant.clientKey, {
                        stockQuantity: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
                      });
                    }}
                    className="mt-1 w-full rounded-xl border border-[#efccd4] px-3 py-2"
                  />
                </label> : null}
                {usesPresetSizes && presetSizes.length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-4">
                    <p className="text-xs font-semibold text-[#7A3F63]">Stock by size</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {presetSizes.map((sizeLabel) => {
                        const currentStock = variant.sizeInventory?.find((row) => row.sizeLabel === sizeLabel)?.stockQuantity ?? 0;
                        return (
                          <label key={sizeLabel} className="text-xs font-semibold text-[#76504a]">
                            Size {sizeLabel}
                            <input type="number" min="0" step="1" placeholder="0" value={currentStock || ""} onChange={(event) => {
                              const nextStock = event.target.value === "" ? 0 : Math.max(0, Math.floor(Number(event.target.value)));
                              const rows = variant.sizeInventory ?? [];
                              updateVariant(variant.clientKey, { sizeInventory: [
                                ...rows.filter((row) => row.sizeLabel !== sizeLabel),
                                { id: rows.find((row) => row.sizeLabel === sizeLabel)?.id ?? "", sizeLabel, stockQuantity: nextStock },
                              ] });
                            }} className="mt-1 w-full rounded-xl border border-[#efccd4] px-3 py-2" />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                <VariantImageUploader productId={productId} variantId={variant.id} label={`${productName} - ${label}`} initialImages={variant.images ?? []} />
                <details className="mt-4 rounded-xl border border-[#f2dde3] bg-[#fffaf8] p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-[#7A3F63]">Advanced options</summary>
                  <p className="mt-2 text-xs text-[#76504a]">Leave these blank to use the product&apos;s default price and material.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-[#76504a]">Price override
                      <input type="number" min="0" step="0.01" value={variant.priceOverride ?? ""} onChange={(event) => updateVariant(variant.clientKey, { priceOverride: event.target.value === "" ? null : Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-[#efccd4] bg-white px-3 py-2" />
                    </label>
                    <label className="text-xs font-semibold text-[#76504a]">Material override
                      <select value={variant.materialTypeOverride ?? ""} onChange={(event) => updateVariant(variant.clientKey, { materialTypeOverride: (event.target.value || null) as AdminVariantValue["materialTypeOverride"] })} className="mt-1 w-full rounded-xl border border-[#efccd4] bg-white px-3 py-2">
                        <option value="">Use product material</option>
                        <option value="gold_plated">Gold-plated</option>
                        <option value="stainless_steel">Non-tarnish / Stainless steel</option>
                      </select>
                    </label>
                  </div>
                </details>
              </article>
            );
          }) : (
            <p className="rounded-2xl bg-white p-4 text-sm text-[#8f5574]">Add at least one finish or color to create variant combinations.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
