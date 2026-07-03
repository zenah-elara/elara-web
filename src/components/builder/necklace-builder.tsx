"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FinishBadge,
  getFinishCareCopy,
  getFinishLabel,
  type ProductFinishType,
} from "@/components/finish-badge";
import {
  builderAddonPrices,
  calculateBuilderPricing,
  getBuilderPriceTier,
  getBuilderPricingTotal,
} from "@/features/builder/pricing";
import type { CatalogProduct } from "@/features/catalog/types";
import type { BuilderSelectedCartItem } from "@/features/cart/types";
import { addCustomNecklaceItem, createCartItemId } from "@/features/cart/utils";
import { formatPrice } from "@/lib/data";

type BuilderProductType = "charm" | "mini_charm" | "pendant" | "connector";

type SelectedBuilderItem = BuilderSelectedCartItem;

type NecklaceBuilderProps = {
  chains: CatalogProduct[];
  builderItems: CatalogProduct[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getTypeLabel(type?: string) {
  if (type === "mini_charm") return "Mini charm";
  if (type === "connector") return "Connector";
  if (type === "pendant") return "Pendant";
  return "Main charm";
}

function toBuilderType(type?: CatalogProduct["productType"]): BuilderProductType {
  return type === "mini_charm" ||
    type === "pendant" ||
    type === "connector"
    ? type
    : "charm";
}

function getTierLabel(tier?: CatalogProduct["builderPriceTier"]) {
  return getBuilderPriceTier(tier) === "premium" ? "Premium" : "Basic";
}

function getBuilderPricingNote(product: CatalogProduct) {
  if (product.productType === "mini_charm") {
    const tier = getBuilderPriceTier(product.builderPriceTier);
    const addOnPrice =
      tier === "premium"
        ? builderAddonPrices.premiumMiniCharm
        : builderAddonPrices.basicMiniCharm;

    return `${getTierLabel(tier)} mini charm · first mini included, extras +${formatPrice(addOnPrice)}`;
  }

  if (product.productType === "connector") {
    return `Connector · +${formatPrice(builderAddonPrices.connector)}`;
  }

  return `First main charm included · extras +${formatPrice(builderAddonPrices.mainCharm)}`;
}

function getSelectedMaterialRows({
  chain,
  connector,
  selectedItems,
}: {
  chain?: CatalogProduct;
  connector: SelectedBuilderItem | null;
  selectedItems: SelectedBuilderItem[];
}) {
  const rows: {
    label: string;
    name: string;
    finishType: ProductFinishType;
  }[] = [];

  if (chain?.finishType) {
    rows.push({
      label: "Chain",
      name: chain.name,
      finishType: chain.finishType,
    });
  }

  if (connector?.finishType) {
    rows.push({
      label: "Connector",
      name: connector.name,
      finishType: connector.finishType,
    });
  }

  selectedItems.forEach((item) => {
    if (!item.finishType) return;

    rows.push({
      label: getTypeLabel(item.productType),
      name: item.name,
      finishType: item.finishType,
    });
  });

  return rows;
}

function getUniqueFinishTypes(
  rows: { finishType: ProductFinishType }[],
): ProductFinishType[] {
  return Array.from(new Set(rows.map((row) => row.finishType)));
}

export function NecklaceBuilder({
  chains,
  builderItems,
}: NecklaceBuilderProps) {
  const availableChains = chains.filter((chain) => chain.stock > 0);
  const availableBuilderItems = builderItems.filter((item) => item.stock > 0);
  const availableArrangementItems = availableBuilderItems.filter(
    (item) => item.productType !== "connector",
  );
  const [selectedChainId, setSelectedChainId] = useState(
    availableChains[0]?.id ?? "",
  );
  const [chainLength, setChainLength] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedBuilderItem[]>([]);
  const [selectedConnector, setSelectedConnector] =
    useState<SelectedBuilderItem | null>(null);
  const [message, setMessage] = useState("");
  const selectedChain = availableChains.find(
    (chain) => chain.id === selectedChainId,
  );
  const pricingSummary = selectedChain
    ? calculateBuilderPricing({
        chain: selectedChain,
        selectedItems,
        connector: selectedConnector,
      })
    : null;
  const selectedChainLengthOptions =
    selectedChain?.isSizeCustomizable && selectedChain.sizeOptions?.length
      ? selectedChain.sizeOptions
      : [];
  const requiresChainLength = selectedChainLengthOptions.length > 0;
  const effectiveChainLength = requiresChainLength
    ? selectedChainLengthOptions.includes(chainLength)
      ? chainLength
      : selectedChainLengthOptions[0] ?? ""
    : "";
  const selectedCounts = useMemo(() => {
    const counts = new Map<string, number>();

    [...selectedItems, selectedConnector].forEach((item) => {
      if (!item) return;
      counts.set(item.productId, (counts.get(item.productId) ?? 0) + item.quantity);
    });

    return counts;
  }, [selectedItems, selectedConnector]);
  const total = getBuilderPricingTotal(pricingSummary);
  const isBuilderReady =
    availableChains.length > 0 && availableArrangementItems.length > 0;
  const canAddToCart = Boolean(selectedChain) && Boolean(pricingSummary);
  const groupedItems = [
    {
      label: "Main charms / pendants",
      items: availableArrangementItems.filter(
        (item) =>
          !item.productType ||
          item.productType === "charm" ||
          item.productType === "pendant",
      ),
    },
    {
      label: "Mini charms",
      items: availableArrangementItems.filter(
        (item) => item.productType === "mini_charm",
      ),
    },
  ];
  const connectorItems = availableBuilderItems.filter(
    (item) => item.productType === "connector",
  );
  const materialRows = getSelectedMaterialRows({
    chain: selectedChain,
    connector: selectedConnector,
    selectedItems,
  });
  const uniqueMaterialTypes = getUniqueFinishTypes(materialRows);

  function addSelectedItem(product: CatalogProduct) {
    const alreadySelected = selectedCounts.get(product.id) ?? 0;

    if (alreadySelected >= product.stock) {
      setMessage(`${product.name} is not available in that quantity.`);
      return;
    }

    const nextItem: SelectedBuilderItem = {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      productType: toBuilderType(product.productType),
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
      stockQuantity: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      finishType: product.finishType,
      builderPriceTier: getBuilderPriceTier(product.builderPriceTier),
      arrangementOrder:
        product.productType === "connector" ? -1 : selectedItems.length,
    };

    if (product.productType === "connector") {
      setSelectedConnector(nextItem);
      setMessage(`${product.name} selected as your connector.`);
      return;
    }

    setSelectedItems((items) => [
      ...items,
      {
        ...nextItem,
        arrangementOrder: items.length,
      },
    ]);
    setMessage("");
  }

  function resequence(items: SelectedBuilderItem[]) {
    return items.map((item, index) => ({ ...item, arrangementOrder: index }));
  }

  function moveItem(index: number, direction: -1 | 1) {
    setSelectedItems((items) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= items.length) {
        return items;
      }

      const copy = [...items];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);

      return resequence(copy);
    });
  }

  function removeItem(index: number) {
    setSelectedItems((items) => resequence(items.filter((_, i) => i !== index)));
  }

  function updateItemQuantity(index: number, quantity: number) {
    setSelectedItems((items) => {
      const item = items[index];

      if (!item) return items;

      const otherQuantity = items.reduce(
        (sum, candidate, candidateIndex) =>
          candidate.productId === item.productId && candidateIndex !== index
            ? sum + candidate.quantity
            : sum,
        0,
      );
      const maxForThisRow = Math.max(
        1,
        (item.stockQuantity ?? quantity) - otherQuantity,
      );
      const safeQuantity = Math.max(1, Math.min(quantity, maxForThisRow));

      return items.map((candidate, candidateIndex) =>
        candidateIndex === index
          ? { ...candidate, quantity: safeQuantity }
          : candidate,
      );
    });
  }

  function addToCart() {
    if (!isBuilderReady) {
      setMessage(
        "Build Your Elara Piece needs active builder products first. Add chain, charm, pendant, mini charm, or connector products in Admin to start using the builder.",
      );
      return;
    }

    if (!canAddToCart || !selectedChain) {
      setMessage("Please choose at least one charm or mini charm to complete your piece.");
      return;
    }

    if (requiresChainLength && !effectiveChainLength) {
      setMessage("Choose your chain length before adding this piece to cart.");
      return;
    }

    const cartItemId = createCartItemId("custom-necklace");

    addCustomNecklaceItem({
      cartItemId,
      itemType: "custom_necklace",
      productId: cartItemId,
      slug: "custom-necklace",
      name: "Custom Necklace",
      unitPrice: total,
      quantity: 1,
      chain: {
        productId: selectedChain.id,
        name: selectedChain.name,
        slug: selectedChain.slug,
        price: selectedChain.price,
        imageUrl: selectedChain.imageUrl,
        stockQuantity: selectedChain.stock,
        lowStockThreshold: selectedChain.lowStockThreshold,
        finishType: selectedChain.finishType,
        builderPriceTier: getBuilderPriceTier(selectedChain.builderPriceTier),
        selectedSize: requiresChainLength ? effectiveChainLength : null,
        sizeLabel: selectedChain.sizeLabel ?? "Length",
      },
      chainLength: requiresChainLength ? effectiveChainLength : null,
      connector: selectedConnector
        ? {
            ...selectedConnector,
            arrangementOrder: -1,
          }
        : null,
      selectedItems: selectedItems.map((item, index) => ({
        ...item,
        arrangementOrder: index,
      })),
      pricingSummary: pricingSummary ?? undefined,
    });
    setMessage("Custom necklace added to cart.");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
      <section className="rounded-[2rem] border border-[#f0c9d6] bg-gradient-to-br from-[#ffe1ec] via-[#fff8fb] to-[#fff2d9] p-5 shadow-[0_24px_60px_rgba(201,130,149,0.16)] lg:sticky lg:top-24 lg:h-fit">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c6a15a]">
          Necklace preview
        </p>
        <div className="mt-5 rounded-[2rem] bg-white/72 p-5">
          <div className="relative mx-auto min-h-52 max-w-2xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#ffd8e8] via-[#fff8f1] to-[#f7dba4] p-6">
            <div className="absolute left-1/2 top-8 h-36 w-72 -translate-x-1/2 rounded-b-full border-b-4 border-[#d5a84f]" />
            <div className="relative mt-20 flex min-h-24 flex-wrap items-center justify-center gap-3">
              {selectedConnector ? (
                <div className="flex min-h-20 min-w-28 flex-col items-center justify-center rounded-[1.25rem] border border-[#d8b36a] bg-white/82 px-4 py-3 text-xs font-semibold text-[#7A3F63] shadow-sm">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#c6a15a]">
                    Connector
                  </span>
                  <span className="mt-1">{selectedConnector.name}</span>
                </div>
              ) : null}
              {selectedItems.slice(0, 9).map((item) => (
                <div
                  key={`${item.productId}-${item.arrangementOrder}`}
                  className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#d8b36a] bg-[#fffaf8] text-xs font-semibold text-[#7A3F63] shadow-sm"
                  title={item.name}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(item.name)
                  )}
                </div>
              ))}
              {selectedItems.length > 9 ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#d8b36a] bg-[#fffaf8] text-xs font-semibold text-[#7A3F63]">
                  +{selectedItems.length - 9}
                </div>
              ) : null}
              {selectedItems.length === 0 ? (
                <p className="rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-[#7A3F63]">
                  Add a main charm, pendant, or mini charm to preview your piece
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-5 text-sm leading-6 text-[#76504a]">
            <p className="font-semibold text-[#7A3F63]">
              {selectedChain ? selectedChain.name : "Choose your chain"}
            </p>
            {requiresChainLength ? (
              <p>
                {selectedChain?.sizeLabel ?? "Length"}: {effectiveChainLength}
              </p>
            ) : selectedChain?.fixedSizeNote ? (
              <p>{selectedChain.fixedSizeNote}</p>
            ) : null}
            {selectedConnector ? <p>Connector: {selectedConnector.name}</p> : null}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[#efccd4] bg-white/75 p-4">
          <p className="font-semibold text-[#7A3F63]">
            {selectedConnector ? "Inside connector" : "Arrangement"}
          </p>
          <ol className="mt-3 space-y-2 text-sm text-[#76504a]">
            {selectedItems.map((item, index) => (
              <li
                key={`${item.productId}-${index}`}
                className="rounded-2xl bg-[#fff7fa] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {index + 1}. {item.name} · {getTypeLabel(item.productType)}
                  </span>
                  <span className="text-xs font-semibold text-[#9A4F78]">
                    Priced in review
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    className="rounded-full border border-[#D5A84F] bg-[#FFF8F3] px-3 py-1 text-xs font-semibold text-[#7A3F63]"
                  >
                    Move left
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    className="rounded-full border border-[#D5A84F] bg-[#FFF8F3] px-3 py-1 text-xs font-semibold text-[#7A3F63]"
                  >
                    Move right
                  </button>
                  <button
                    type="button"
                    onClick={() => updateItemQuantity(index, item.quantity - 1)}
                    className="rounded-full border border-[#D5A84F] bg-[#FFF8F3] px-3 py-1 text-xs font-semibold text-[#7A3F63]"
                  >
                    -
                  </button>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#7A3F63]">
                    Qty {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateItemQuantity(index, item.quantity + 1)}
                    className="rounded-full border border-[#D5A84F] bg-[#FFF8F3] px-3 py-1 text-xs font-semibold text-[#7A3F63]"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-semibold text-rose"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
            {selectedItems.length === 0 ? <li>No selected pendants or charms yet.</li> : null}
          </ol>
          {selectedConnector ? (
            <div className="mt-4 rounded-2xl bg-[#fff8e8] p-3 text-sm text-[#76504a]">
              <span className="font-semibold text-[#7A3F63]">Connector:</span>{" "}
              {selectedConnector.name} · {formatPrice(builderAddonPrices.connector)}
              <button
                type="button"
                onClick={() => setSelectedConnector(null)}
                className="ml-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose"
              >
                Remove
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-5">
        {!isBuilderReady ? (
          <div className="rounded-3xl border border-[#efd2bc] bg-[#fff7ef] p-5 text-sm leading-6 text-[#76504a]">
            <p className="font-semibold text-[#7A3F63]">
              Builder setup needed
            </p>
            <p className="mt-2">
              Build Your Elara Piece needs active builder products first. Add
              chain, charm, pendant, mini charm, or connector products in Admin
              to start using the builder.
            </p>
            {availableChains.length === 0 ? (
              <p className="mt-2">
                Add an active chain product with stock in Admin to start
                building.
              </p>
            ) : null}
            {availableArrangementItems.length === 0 ? (
              <p className="mt-2">
                Add active charms, pendants, mini charms, or connectors in Admin
                to make them available here.
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="rounded-3xl boutique-card p-5">
          <p className="text-sm font-semibold text-gold">Step 1</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#7A3F63]">
            Choose your chain
          </h2>
          <div className="mt-4 grid gap-3">
            {availableChains.map((chain) => (
              <button
                key={chain.id}
                type="button"
                onClick={() => setSelectedChainId(chain.id)}
                className={`grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl border p-3 text-left ${
                  selectedChainId === chain.id
                    ? "border-[#d8b36a] bg-[#fff8e8]"
                    : "border-[#efccd4] bg-[#fffaf8]"
                }`}
              >
                <span className="h-16 w-16 overflow-hidden rounded-2xl bg-[#fff1f6]">
                  {chain.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={chain.imageUrl}
                      alt={chain.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </span>
                <span>
                  <span className="block font-semibold text-[#7A3F63]">
                    {chain.name}
                  </span>
                  <span className="text-xs text-[#76504a]">
                    {getTierLabel(chain.builderPriceTier)} chain · combo pricing
                  </span>
                  {chain.finishType ? (
                    <span className="mt-1 block">
                      <FinishBadge
                        finishType={chain.finishType}
                        className="px-2 py-0.5"
                      />
                    </span>
                  ) : null}
                </span>
                <span className="font-semibold text-[#7A3F63]">
                  {getTierLabel(chain.builderPriceTier)}
                </span>
              </button>
            ))}
            {availableChains.length === 0 ? (
              <p className="text-sm text-[#76504a]">
                Add an active chain product with stock in Admin to start
                building.
              </p>
            ) : null}
          </div>
        </div>

        {selectedChain ? (
          <div className="rounded-3xl boutique-card p-5">
            <p className="text-sm font-semibold text-gold">Step 2</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#7A3F63]">
              {requiresChainLength
                ? `Choose ${selectedChain.sizeLabel ?? "length"}`
                : "Chain sizing"}
            </h2>
            {requiresChainLength ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {selectedChainLengthOptions.map((length) => (
                  <button
                    key={length}
                    type="button"
                    onClick={() => setChainLength(length)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                      effectiveChainLength === length
                        ? "border-[#d8b36a] bg-[#fff8e8] text-[#7A3F63]"
                        : "border-[#efccd4] bg-[#fffaf8] text-[#76504a]"
                    }`}
                  >
                    {length}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-2xl bg-[#fff7fa] p-3 text-sm leading-6 text-[#76504a]">
                {selectedChain.fixedSizeNote ??
                  "This chain does not require a length selection."}
              </p>
            )}
          </div>
        ) : null}

        <div className="rounded-3xl boutique-card p-5">
          <p className="text-sm font-semibold text-gold">Step 3</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#7A3F63]">
            Pick pendants, charms, and minis
          </h2>
          <div className="mt-5 space-y-5">
            {groupedItems.map((group) => (
              <div key={group.label}>
                <h3 className="font-semibold text-[#7A3F63]">{group.label}</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {group.items.map((item) => {
                    const selectedCount = selectedCounts.get(item.id) ?? 0;
                    const isMaxed = selectedCount >= item.stock;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isMaxed}
                        onClick={() => addSelectedItem(item)}
                        className="grid grid-cols-[56px_1fr] gap-3 rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-3 text-left disabled:opacity-45"
                      >
                        <span className="h-14 w-14 overflow-hidden rounded-2xl bg-[#fff1f6]">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </span>
                        <span>
                          <span className="block font-semibold text-[#7A3F63]">
                            {item.name}
                          </span>
                          <span className="block text-xs text-[#76504a]">
                            {getBuilderPricingNote(item)}
                          </span>
                          <span className="block text-xs text-[#9A4F78]">
                            {selectedCount > 0 ? `Selected ${selectedCount}` : "Available"}
                          </span>
                          {item.finishType ? (
                            <span className="mt-1 block">
                              <FinishBadge
                                finishType={item.finishType}
                                className="px-2 py-0.5"
                              />
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {group.items.length === 0 ? (
                  <p className="mt-3 rounded-2xl bg-[#fff7fa] p-3 text-sm text-[#76504a]">
                    Add active charms, pendants, mini charms, or connectors in
                    Admin to make them available here.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl boutique-card p-5">
          <p className="text-sm font-semibold text-gold">Optional</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#7A3F63]">
            Choose a connector
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#76504a]">
            A connector works like a holder for your selected pendants and
            charms. Choose one, or keep your charms directly on the chain.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {connectorItems.map((item) => {
              const isSelected = selectedConnector?.productId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addSelectedItem(item)}
                  className={`grid grid-cols-[56px_1fr] gap-3 rounded-2xl border p-3 text-left ${
                    isSelected
                      ? "border-[#d8b36a] bg-[#fff8e8]"
                      : "border-[#efccd4] bg-[#fffaf8]"
                  }`}
                >
                  <span className="h-14 w-14 overflow-hidden rounded-2xl bg-[#fff1f6]">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </span>
                  <span>
                    <span className="block font-semibold text-[#7A3F63]">
                      {item.name}
                    </span>
                    <span className="block text-xs text-[#76504a]">
                      {getBuilderPricingNote(item)}
                    </span>
                    <span className="block text-xs text-[#9A4F78]">
                      {isSelected ? "Selected connector" : "Available"}
                    </span>
                    {item.finishType ? (
                      <span className="mt-1 block">
                        <FinishBadge
                          finishType={item.finishType}
                          className="px-2 py-0.5"
                        />
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
            {connectorItems.length === 0 ? (
              <p className="text-sm text-[#76504a]">
                No active connector products are available yet.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl boutique-card p-5">
          <p className="text-sm font-semibold text-gold">Step 5</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#7A3F63]">
            Review total
          </h2>
          <div className="mt-4 space-y-2 text-sm text-[#76504a]">
            {pricingSummary ? (
              <>
                <div className="rounded-2xl border border-[#efccd4] bg-[#fff7fa] p-3">
                  <div className="flex justify-between gap-4 font-semibold text-[#7A3F63]">
                    <span>{pricingSummary.cartLabel}</span>
                    <span>{formatPrice(pricingSummary.basePrice)}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#76504a]">
                    {pricingSummary.includedDescription}
                  </p>
                  <p className="mt-2 text-xs text-[#76504a]">
                    Included items: {selectedChain?.name} +{" "}
                    {pricingSummary.includedItem.name}
                  </p>
                  {requiresChainLength ? (
                    <p className="mt-1 text-xs text-[#76504a]">
                      {selectedChain?.sizeLabel ?? "Length"}:{" "}
                      {effectiveChainLength}
                    </p>
                  ) : null}
                </div>
                {pricingSummary.addOns.length > 0 ? (
                  <div className="space-y-2 rounded-2xl border border-[#efccd4] bg-white/70 p-3">
                    <p className="font-semibold text-[#7A3F63]">Add-ons</p>
                    {pricingSummary.addOns.map((addOn) => (
                      <div
                        key={`${addOn.productId}-${addOn.label}`}
                        className="flex justify-between gap-4"
                      >
                        <span>
                          {addOn.name}
                          {addOn.quantity > 1 ? ` x ${addOn.quantity}` : ""} ·{" "}
                          {addOn.label}
                        </span>
                        <span>{formatPrice(addOn.lineTotal)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {materialRows.length > 0 ? (
                  <div className="space-y-2 rounded-2xl border border-[#e8c891] bg-[#fff8e8] p-3">
                    <p className="font-semibold text-[#7A3F63]">
                      Material summary
                    </p>
                    <ul className="space-y-1">
                      {materialRows.map((row, index) => (
                        <li key={`${row.label}-${row.name}-${index}`}>
                          {row.label}: {row.name} ·{" "}
                          {getFinishLabel(row.finishType)}
                        </li>
                      ))}
                    </ul>
                    {uniqueMaterialTypes.length > 1 ? (
                      <p className="text-xs leading-5 text-[#76504a]">
                        Your selected piece may include mixed materials. Please
                        follow the care notes for each part to help preserve
                        your jewelry.
                      </p>
                    ) : null}
                    <div className="space-y-1 text-xs leading-5 text-[#76504a]">
                      {uniqueMaterialTypes.map((finishType) => {
                        const careCopy = getFinishCareCopy(finishType);

                        return careCopy ? (
                          <p key={finishType}>{careCopy}</p>
                        ) : null;
                      })}
                    </div>
                  </div>
                ) : null}
              </>
            ) : selectedChain ? (
              <div className="rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-3 font-semibold text-[#76504a]">
                Please choose at least one charm or mini charm to complete your
                piece.
              </div>
            ) : null}
            <div className="flex justify-between border-t border-[#efccd4] pt-3 text-base font-semibold text-[#7A3F63]">
              <span>Estimated total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          {message ? (
            <p className="mt-4 rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-3 text-sm font-semibold text-[#76504a]">
              {message}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addToCart}
              disabled={!canAddToCart}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(201,130,149,0.22)] disabled:cursor-not-allowed disabled:bg-[#e9c0cd] disabled:text-white/80 disabled:shadow-none"
            >
              Add to Cart
            </button>
            <Link
              href="/cart"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D5A84F] bg-[#FFF8F3] px-5 py-2 text-sm font-semibold text-[#7A3F63]"
            >
              View Cart
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
