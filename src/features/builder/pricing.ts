import type { CatalogProduct } from "@/features/catalog/types";
import type {
  BuilderPricingSummary,
  BuilderSelectedCartItem,
} from "@/features/cart/types";

type BuilderTier = "basic" | "premium";

type SelectedUnit = {
  item: BuilderSelectedCartItem;
  unitIndex: number;
};

const chainMainCharmBasePrices: Record<BuilderTier, number> = {
  basic: 159,
  premium: 179,
};

const chainMiniCharmBasePrices: Record<BuilderTier, Record<BuilderTier, number>> = {
  basic: {
    basic: 99,
    premium: 109,
  },
  premium: {
    basic: 119,
    premium: 129,
  },
};

export const builderAddonPrices = {
  basicMiniCharm: 19,
  premiumMiniCharm: 29,
  mainCharm: 69,
  connector: 39,
} as const;

export function getBuilderPriceTier(
  value?: CatalogProduct["builderPriceTier"] | BuilderSelectedCartItem["builderPriceTier"],
): BuilderTier {
  return value === "premium" ? "premium" : "basic";
}

function isMainCharm(item: BuilderSelectedCartItem) {
  return item.productType === "charm" || item.productType === "pendant";
}

function flattenUnits(items: BuilderSelectedCartItem[]) {
  return items.flatMap((item) =>
    Array.from({ length: item.quantity }, (_, unitIndex) => ({
      item,
      unitIndex,
    })),
  );
}

function getMiniCharmAddOnPrice(item: BuilderSelectedCartItem) {
  return getBuilderPriceTier(item.builderPriceTier) === "premium"
    ? builderAddonPrices.premiumMiniCharm
    : builderAddonPrices.basicMiniCharm;
}

function getMiniCharmAddOnLabel(item: BuilderSelectedCartItem) {
  return getBuilderPriceTier(item.builderPriceTier) === "premium"
    ? "Premium mini charm"
    : "Basic mini charm";
}

function unitKey(unit: SelectedUnit) {
  return `${unit.item.productId}:${unit.item.arrangementOrder}:${unit.unitIndex}`;
}

function groupAddOns(
  units: SelectedUnit[],
  includedKey: string,
  connector?: BuilderSelectedCartItem | null,
): BuilderPricingSummary["addOns"] {
  const grouped = new Map<string, BuilderPricingSummary["addOns"][number]>();

  function add(
    item: BuilderSelectedCartItem,
    label: string,
    unitPrice: number,
    quantity = 1,
  ) {
    const key = `${item.productId}:${label}:${unitPrice}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.quantity += quantity;
      existing.lineTotal = existing.quantity * existing.unitPrice;
      return;
    }

    grouped.set(key, {
      productId: item.productId,
      name: item.name,
      productType: item.productType,
      label,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    });
  }

  units.forEach((unit) => {
    if (unitKey(unit) === includedKey) {
      return;
    }

    if (unit.item.productType === "mini_charm") {
      add(unit.item, getMiniCharmAddOnLabel(unit.item), getMiniCharmAddOnPrice(unit.item));
      return;
    }

    add(unit.item, "Extra charm/pendant", builderAddonPrices.mainCharm);
  });

  if (connector) {
    add(connector, "Connector", builderAddonPrices.connector, connector.quantity);
  }

  return [...grouped.values()];
}

export function calculateBuilderPricing({
  chain,
  selectedItems,
  connector,
}: {
  chain: CatalogProduct;
  selectedItems: BuilderSelectedCartItem[];
  connector?: BuilderSelectedCartItem | null;
}): BuilderPricingSummary | null {
  const units = flattenUnits(selectedItems);
  const mainCharmUnit = units.find((unit) => isMainCharm(unit.item));
  const miniCharmUnit = units.find((unit) => unit.item.productType === "mini_charm");
  const chainTier = getBuilderPriceTier(chain.builderPriceTier);

  if (mainCharmUnit) {
    const addOns = groupAddOns(units, unitKey(mainCharmUnit), connector);
    const basePrice = chainMainCharmBasePrices[chainTier];

    return {
      comboType: "chain_main_charm",
      baseLabel: "Base necklace",
      cartLabel: "Base necklace: chain + main charm",
      includedDescription: "Includes chain + 1 main charm",
      basePrice,
      includedItem: {
        productId: mainCharmUnit.item.productId,
        name: mainCharmUnit.item.name,
        productType:
          mainCharmUnit.item.productType === "pendant" ? "pendant" : "charm",
      },
      addOns,
    };
  }

  if (miniCharmUnit) {
    const miniTier = getBuilderPriceTier(miniCharmUnit.item.builderPriceTier);
    const addOns = groupAddOns(units, unitKey(miniCharmUnit), connector);
    const basePrice = chainMiniCharmBasePrices[chainTier][miniTier];

    return {
      comboType: "chain_mini_charm",
      baseLabel: "Mini necklace",
      cartLabel: "Mini necklace: chain + mini charm",
      includedDescription: "Includes chain + 1 mini charm",
      basePrice,
      includedItem: {
        productId: miniCharmUnit.item.productId,
        name: miniCharmUnit.item.name,
        productType: "mini_charm",
      },
      addOns,
    };
  }

  return null;
}

export function getBuilderPricingTotal(summary: BuilderPricingSummary | null) {
  if (!summary) {
    return 0;
  }

  return (
    summary.basePrice +
    summary.addOns.reduce((total, addOn) => total + addOn.lineTotal, 0)
  );
}
