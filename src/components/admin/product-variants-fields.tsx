"use client";

import { useMemo, useState } from "react";
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
};

function splitOptions(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function combinationKey(finish: string | null, color: string | null) {
  return `${finish ?? ""}::${color ?? ""}`.toLowerCase();
}

export function ProductVariantsFields({
  defaultEnabled = false,
  defaultVariants = [],
  productName = "Product preview",
  basePrice = 0,
}: {
  defaultEnabled?: boolean;
  defaultVariants?: AdminVariantValue[];
  productName?: string;
  basePrice?: number;
}) {
  const defaultFinishes = [...new Set(defaultVariants.map((v) => v.finish).filter(Boolean))].join(", ");
  const defaultColors = [...new Set(defaultVariants.map((v) => v.color).filter(Boolean))].join(", ");
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [finishesText, setFinishesText] = useState(defaultFinishes);
  const [colorsText, setColorsText] = useState(defaultColors);
  const [variants, setVariants] = useState(defaultVariants);
  const [selectedKey, setSelectedKey] = useState(defaultVariants[0]?.clientKey ?? "");
  const [localPreviews, setLocalPreviews] = useState<Record<string, string[]>>({});

  const regenerate = (nextFinishesText: string, nextColorsText: string) => {
    const finishes = splitOptions(nextFinishesText);
    const colors = splitOptions(nextColorsText);
    const pairs = finishes.length && colors.length
      ? finishes.flatMap((finish) => colors.map((color) => [finish, color] as const))
      : finishes.length
        ? finishes.map((finish) => [finish, null] as const)
        : colors.map((color) => [null, color] as const);
    const existing = new Map(variants.map((variant) => [combinationKey(variant.finish, variant.color), variant]));
    const next = pairs.map(([finish, color], index) => {
      const current = existing.get(combinationKey(finish, color));
      return current ?? {
        clientKey: `new-${index}-${combinationKey(finish, color).replace(/[^a-z0-9]+/g, "-")}`,
        finish,
        color,
        stockQuantity: 0,
        priceOverride: null,
        materialTypeOverride: null,
        isActive: true,
        sortOrder: index,
        images: [],
      };
    });
    setVariants(next);
    if (!next.some((variant) => variant.clientKey === selectedKey)) {
      setSelectedKey(next[0]?.clientKey ?? "");
    }
  };

  const updateVariant = (clientKey: string, patch: Partial<AdminVariantValue>) => {
    setVariants((current) => current.map((variant) =>
      variant.clientKey === clientKey ? { ...variant, ...patch } : variant,
    ));
  };
  const selected = variants.find((variant) => variant.clientKey === selectedKey) ?? variants[0];
  const selectedImages = selected
    ? [...(localPreviews[selected.clientKey] ?? []), ...(selected.images ?? []).map((image) => image.imageUrl)]
    : [];
  const effectivePrice = selected?.priceOverride ?? basePrice;
  const serialized = useMemo(
    () => enabled ? variants.map((variant) => ({
      clientKey: variant.clientKey,
      id: variant.id,
      finish: variant.finish,
      color: variant.color,
      stockQuantity: variant.stockQuantity,
      priceOverride: variant.priceOverride,
      materialTypeOverride: variant.materialTypeOverride,
      isActive: variant.isActive,
      sortOrder: variant.sortOrder,
    })) : [],
    [enabled, variants],
  );

  return (
    <section className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-5">
      <input type="hidden" name="variants_json" value={JSON.stringify(serialized)} />
      <label className="flex items-start gap-3">
        <input
          name="has_variants"
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span>
          <span className="block text-sm font-semibold text-[#7A3F63]">This product has variants</span>
          <span className="mt-1 block text-xs leading-5 text-[#76504a]">
            Use this when the same design is available in different finishes or colors.
          </span>
        </span>
      </label>

      {enabled ? (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#7A3F63]">
              Finish options
              <input
                value={finishesText}
                onChange={(event) => {
                  setFinishesText(event.target.value);
                  regenerate(event.target.value, colorsText);
                }}
                placeholder="Gold, Silver, Rose Gold"
                className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="block text-sm font-semibold text-[#7A3F63]">
              Color options
              <input
                value={colorsText}
                onChange={(event) => {
                  setColorsText(event.target.value);
                  regenerate(finishesText, event.target.value);
                }}
                placeholder="Clear, Pink, Blue"
                className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm outline-none"
              />
            </label>
          </div>

          {variants.length ? (
            <div className="grid gap-4">
              {variants.map((variant) => (
                <div key={variant.clientKey} className="rounded-2xl border border-[#efccd4] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-[#7A3F63]">
                      {[variant.finish, variant.color].filter(Boolean).join(" + ")}
                    </p>
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#7A3F63]">
                      <input type="checkbox" checked={variant.isActive} onChange={(e) => updateVariant(variant.clientKey, { isActive: e.target.checked })} />
                      Active
                    </label>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <label className="text-xs font-semibold text-[#76504a]">Stock
                      <input type="number" min="0" value={variant.stockQuantity} onChange={(e) => updateVariant(variant.clientKey, { stockQuantity: Math.max(0, Number(e.target.value)) })} className="mt-1 w-full rounded-xl border border-[#efccd4] px-3 py-2" />
                    </label>
                    <label className="text-xs font-semibold text-[#76504a]">Price override
                      <input type="number" min="0" step="0.01" value={variant.priceOverride ?? ""} onChange={(e) => updateVariant(variant.clientKey, { priceOverride: e.target.value === "" ? null : Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-[#efccd4] px-3 py-2" />
                    </label>
                    <label className="text-xs font-semibold text-[#76504a]">Material override
                      <select value={variant.materialTypeOverride ?? ""} onChange={(e) => updateVariant(variant.clientKey, { materialTypeOverride: (e.target.value || null) as AdminVariantValue["materialTypeOverride"] })} className="mt-1 w-full rounded-xl border border-[#efccd4] px-3 py-2">
                        <option value="">Inherit product</option>
                        <option value="gold_plated">Gold-plated</option>
                        <option value="stainless_steel">Non-tarnish / Stainless steel</option>
                      </select>
                    </label>
                  </div>
                  <label className="mt-4 block text-xs font-semibold text-[#76504a]">
                    Images
                    <input name={`variant_images_${variant.clientKey}`} type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-2 block w-full text-sm" onChange={(event) => {
                      const urls = [...(event.target.files ?? [])].map((file) => URL.createObjectURL(file));
                      setLocalPreviews((current) => ({ ...current, [variant.clientKey]: urls }));
                    }} />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(localPreviews[variant.clientKey] ?? []).map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={url} src={url} alt="New variant preview" className="h-16 w-16 rounded-xl object-cover" />
                    ))}
                    {(variant.images ?? []).map((image) => (
                      <label key={image.id} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.imageUrl} alt={image.altText ?? "Variant image"} className="h-16 w-16 rounded-xl object-cover" />
                        <input name="remove_variant_image_ids" value={image.id} type="checkbox" className="absolute right-1 top-1 h-4 w-4" title="Remove image" />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-white p-4 text-sm text-[#8f5574]">Add at least one Finish or Color option.</p>
          )}

          {selected ? (
            <div className="rounded-2xl border border-[#e6c98d] bg-[#fffdf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c09a4f]">Admin preview</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {variants.map((variant) => (
                  <button key={variant.clientKey} type="button" onClick={() => setSelectedKey(variant.clientKey)} className={`rounded-full px-3 py-1 text-xs font-semibold ${selected.clientKey === variant.clientKey ? "bg-[#d38aa0] text-white" : "bg-[#fff1f6] text-[#8f5574]"}`}>
                    {[variant.finish, variant.color].filter(Boolean).join(" + ")}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4">
                {selectedImages[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedImages[0]} alt="Variant preview" className="h-20 w-20 rounded-2xl object-cover" />
                ) : <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#fff1f6] text-center text-xs text-[#8f5574]">No image</div>}
                <div className="text-sm text-[#76504a]">
                  <p className="font-semibold text-[#7A3F63]">{productName}</p>
                  <p>{formatPrice(effectivePrice)}</p>
                  <p>{selected.finish ? `Finish: ${selected.finish}` : ""} {selected.color ? `· Color: ${selected.color}` : ""}</p>
                  <p>Material: {selected.materialTypeOverride === "stainless_steel" ? "Non-tarnish / Stainless steel" : selected.materialTypeOverride === "gold_plated" ? "Gold-plated" : "Inherit product"}</p>
                  <p>{selected.stockQuantity > 0 ? "In stock" : "Out of stock"}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
