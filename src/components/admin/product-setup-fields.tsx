"use client";

import { useMemo, useState } from "react";
import {
  adminProductTypeGroups,
  type ProductType,
  selectableAdminProductTypes,
} from "@/features/admin/catalog/types";

type ProductSetupFieldsProps = {
  collections: { id: string; name: string }[];
  defaultCollectionId?: string | null;
  defaultProductType?: ProductType;
  defaultBuilderPriceTier?: "basic" | "premium" | null;
};

const builderOnlyTypes = new Set<ProductType>([
  "chain",
  "charm",
  "mini_charm",
  "connector",
]);

const collectionShopTypes = new Set<ProductType>([
  "regular_product",
  "necklace",
  "bracelet",
  "ring",
]);

const pricingGuide = [
  "Basic chain + main charm = ₱159",
  "Premium chain + main charm = ₱179",
  "Basic chain + basic mini charm = ₱99",
  "Basic chain + premium mini charm = ₱109",
  "Premium chain + basic mini charm = ₱119",
  "Premium chain + premium mini charm = ₱129",
  "Extra main charm = +₱69",
  "Extra basic mini charm = +₱19",
  "Extra premium mini charm = +₱29",
  "Connector = +₱39",
];

function findProductTypeHelper(productType: ProductType) {
  return adminProductTypeGroups
    .flatMap((group) => group.options)
    .find((option) => option.value === productType)?.helper;
}

function getProductTypeHelper(productType: ProductType) {
  if (productType === "pendant") {
    return "This is a legacy pendant product. New builder setup should use Main charm instead.";
  }

  if (productType === "custom_necklace") {
    return "This is a legacy custom necklace product type. New products should not use this because custom necklaces are created from the cart/order flow.";
  }

  return (
    findProductTypeHelper(productType) ??
    "Choose where this product belongs before saving."
  );
}

function getCollectionHelper(productType: ProductType) {
  if (builderOnlyTypes.has(productType)) {
    return "Build Your Elara Piece parts do not need a collection because they are accessed through the builder, not the public Collections page.";
  }

  if (collectionShopTypes.has(productType)) {
    return "Collection / Shop products can be assigned to a storefront collection for browsing.";
  }

  return "Legacy product types can stay unassigned unless you intentionally need to preserve an existing setup.";
}

export function ProductSetupGuide() {
  return (
    <section className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-5">
      <p className="text-sm font-semibold text-cocoa">
        Product setup guide
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[#efccd4] bg-white/75 p-4">
          <p className="text-sm font-semibold text-[#7A3F63]">
            Regular Collection / Shop
          </p>
          <p className="mt-2 text-xs leading-5 text-[#76504a]">
            Use this for products customers can browse in Collections, like
            ready-made necklaces, bracelets, rings, or regular products.
          </p>
        </div>
        <div className="rounded-2xl border border-[#efccd4] bg-white/75 p-4">
          <p className="text-sm font-semibold text-[#7A3F63]">
            Build Your Elara Piece
          </p>
          <p className="mt-2 text-xs leading-5 text-[#76504a]">
            Use this for builder parts customers choose inside the Build Your
            Elara Piece flow. These do not appear as regular products in public
            Collections.
          </p>
        </div>
      </div>
    </section>
  );
}

export function ProductSetupFields({
  collections,
  defaultCollectionId = "",
  defaultProductType = "regular_product",
  defaultBuilderPriceTier = "basic",
}: ProductSetupFieldsProps) {
  const initialProductType = selectableAdminProductTypes.includes(
    defaultProductType,
  )
    ? defaultProductType
    : defaultProductType;
  const [productType, setProductType] =
    useState<ProductType>(initialProductType);
  const isLegacyType = !selectableAdminProductTypes.includes(productType);
  const productTypeHelper = useMemo(
    () => getProductTypeHelper(productType),
    [productType],
  );
  const collectionHelper = useMemo(
    () => getCollectionHelper(productType),
    [productType],
  );
  const showBuilderTier =
    productType === "chain" || productType === "mini_charm";

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Collection</span>
        <select
          name="collection_id"
          defaultValue={defaultCollectionId ?? ""}
          className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none"
        >
          <option value="">Unassigned</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs leading-5 text-[#76504a]">
          {collectionHelper}
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Product type</span>
        <select
          name="product_type"
          defaultValue={productType}
          onChange={(event) => {
            const nextProductType = event.target.value as ProductType;
            setProductType(nextProductType);
            window.dispatchEvent(
              new CustomEvent("elara:product-type-change", {
                detail: { productType: nextProductType },
              }),
            );
          }}
          className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none"
        >
          {isLegacyType ? (
            <optgroup label="Legacy current type">
              <option value={productType}>
                {productType === "pendant"
                  ? "Pendant — legacy, use Main charm for new products"
                  : "Custom necklace — legacy, do not use for new products"}
              </option>
            </optgroup>
          ) : null}
          {adminProductTypeGroups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <span className="mt-2 block text-xs leading-5 text-[#76504a]">
          {productTypeHelper}
        </span>
      </label>

      {showBuilderTier ? (
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-cocoa">
            Builder price tier
          </span>
          <select
            name="builder_price_tier"
            defaultValue={defaultBuilderPriceTier ?? "basic"}
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none"
          >
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
          </select>
          <span className="mt-2 block text-xs leading-5 text-[#76504a]">
            Only used for Build Your Elara Piece pricing on chains and mini
            charms.
          </span>
        </label>
      ) : (
        <input
          type="hidden"
          name="builder_price_tier"
          value="basic"
        />
      )}

      <div className="rounded-2xl border border-[#efccd4] bg-white/75 p-4 md:col-span-2">
        <p className="text-sm font-semibold text-[#7A3F63]">
          Build Your Elara Piece pricing guide
        </p>
        <ul className="mt-3 grid gap-2 text-xs leading-5 text-[#76504a] sm:grid-cols-2">
          {pricingGuide.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
