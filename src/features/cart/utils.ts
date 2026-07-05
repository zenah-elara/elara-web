import type {
  BuilderPricingSummary,
  BuilderSelectedCartItem,
  CartInput,
  CartItem,
  CustomNecklaceCartItem,
  RegularCartItem,
} from "./types";
import { normalizeMaterialType } from "@/lib/materials";

export const cartStorageKey = "elara.cart.v1";
export const cartUpdatedEvent = "elara-cart-updated";

export function normalizeQuantity(quantity: number, stockQuantity?: number) {
  const safeQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
  const minQuantity = Math.max(1, safeQuantity);

  if (typeof stockQuantity === "number") {
    return Math.min(minQuantity, Math.max(0, stockQuantity));
  }

  return minQuantity;
}

export function readCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawCart = window.localStorage.getItem(cartStorageKey);
    const parsed = rawCart ? JSON.parse(rawCart) : [];
    const normalizedCart = Array.isArray(parsed)
      ? normalizeStoredCartItems(parsed)
      : [];

    if (JSON.stringify(normalizedCart) !== (rawCart ?? "[]")) {
      window.localStorage.setItem(cartStorageKey, JSON.stringify(normalizedCart));
    }

    return normalizedCart;
  } catch {
    return [];
  }
}

function isRegularCartItem(item: CartItem): item is RegularCartItem {
  return (item.itemType ?? "regular_product") === "regular_product";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function optionalStringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function nullableStringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function builderPriceTierValue(value: unknown) {
  return value === "premium" ? "premium" : "basic";
}

function finishTypeValue(value: unknown) {
  return typeof value === "string" ? normalizeMaterialType(value) : null;
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export function createCartItemId(prefix: string) {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${uuid}`;
}

function normalizeBuilderItem(
  value: unknown,
  arrangementOrderFallback: number,
): BuilderSelectedCartItem {
  const item = isRecord(value) ? value : {};
  const productType = stringValue(item.productType);

  return {
    productId: stringValue(item.productId ?? item.id ?? item.product_id),
    name: stringValue(item.name),
    slug: stringValue(item.slug),
    productType:
      productType === "mini_charm" ||
      productType === "pendant" ||
      productType === "connector"
        ? productType
        : "charm",
    price: numberValue(item.price ?? item.unitPrice ?? item.unit_price),
    quantity: normalizeQuantity(numberValue(item.quantity, 1)),
    imageUrl: optionalStringValue(item.imageUrl ?? item.image_url),
    stockQuantity:
      item.stockQuantity === undefined && item.stock_quantity === undefined
        ? undefined
        : numberValue(item.stockQuantity ?? item.stock_quantity),
    lowStockThreshold:
      item.lowStockThreshold === undefined && item.low_stock_threshold === undefined
        ? undefined
        : numberValue(item.lowStockThreshold ?? item.low_stock_threshold),
    finishType: finishTypeValue(item.finishType),
    builderPriceTier: builderPriceTierValue(
      item.builderPriceTier ?? item.builder_price_tier,
    ),
    selectedSize: nullableStringValue(item.selectedSize ?? item.selected_size),
    sizeLabel: nullableStringValue(item.sizeLabel ?? item.size_label),
    arrangementOrder: Number.isInteger(item.arrangementOrder)
      ? Number(item.arrangementOrder)
      : arrangementOrderFallback,
  };
}

function normalizeBuilderPricingSummary(
  value: unknown,
): BuilderPricingSummary | undefined {
  const summary = isRecord(value) ? value : null;

  if (!summary) {
    return undefined;
  }

  const comboType =
    summary.comboType === "chain_mini_charm"
      ? "chain_mini_charm"
      : "chain_main_charm";
  const includedItem = isRecord(summary.includedItem)
    ? summary.includedItem
    : {};
  const addOns = Array.isArray(summary.addOns) ? summary.addOns : [];

  return {
    comboType,
    baseLabel:
      comboType === "chain_mini_charm" ? "Mini necklace" : "Base necklace",
    cartLabel:
      comboType === "chain_mini_charm"
        ? "Mini necklace: chain + mini charm"
        : "Base necklace: chain + main charm",
    includedDescription:
      comboType === "chain_mini_charm"
        ? "Includes chain + 1 mini charm"
        : "Includes chain + 1 main charm",
    basePrice: numberValue(summary.basePrice ?? summary.base_price),
    includedItem: {
      productId: stringValue(
        includedItem.productId ?? includedItem.id ?? includedItem.product_id,
      ),
      name: stringValue(includedItem.name),
      productType:
        includedItem.productType === "mini_charm"
          ? "mini_charm"
          : includedItem.productType === "pendant"
            ? "pendant"
            : "charm",
    },
    addOns: addOns.map((addOnValue) => {
      const addOn = isRecord(addOnValue) ? addOnValue : {};
      const productType = stringValue(addOn.productType ?? addOn.product_type);
      const quantity = normalizeQuantity(numberValue(addOn.quantity, 1));
      const unitPrice = numberValue(addOn.unitPrice ?? addOn.unit_price);

      return {
        productId: stringValue(addOn.productId ?? addOn.id ?? addOn.product_id),
        name: stringValue(addOn.name),
        productType:
          productType === "mini_charm" ||
          productType === "pendant" ||
          productType === "connector"
            ? productType
            : "charm",
        label: stringValue(addOn.label),
        quantity,
        unitPrice,
        lineTotal: numberValue(addOn.lineTotal ?? addOn.line_total, unitPrice * quantity),
      };
    }),
  };
}

function normalizeStoredCartItem(value: unknown, index: number): CartItem {
  const item = isRecord(value) ? value : {};

  if (item.itemType === "custom_necklace") {
    const chain = isRecord(item.chain) ? item.chain : {};
    const selectedItems = Array.isArray(item.selectedItems)
      ? item.selectedItems
      : [];

    return {
      cartItemId:
        stringValue(item.cartItemId) ||
        createCartItemId("custom-necklace"),
      itemType: "custom_necklace",
      productId:
        stringValue(item.productId) ||
        stringValue(item.cartItemId) ||
        `custom-necklace-${index}`,
      slug: stringValue(item.slug) || "custom-necklace",
      name: "Custom Necklace",
      unitPrice: numberValue(item.unitPrice ?? item.price ?? item.unit_price),
      quantity: 1,
      chain: {
        productId: stringValue(chain.productId ?? chain.id ?? chain.product_id),
        name: stringValue(chain.name),
        slug: stringValue(chain.slug),
        price: numberValue(chain.price ?? chain.unitPrice ?? chain.unit_price),
        imageUrl: optionalStringValue(chain.imageUrl ?? chain.image_url),
        stockQuantity:
          chain.stockQuantity === undefined && chain.stock_quantity === undefined
            ? undefined
            : numberValue(chain.stockQuantity ?? chain.stock_quantity),
        lowStockThreshold:
          chain.lowStockThreshold === undefined &&
          chain.low_stock_threshold === undefined
            ? undefined
            : numberValue(chain.lowStockThreshold ?? chain.low_stock_threshold),
        finishType: finishTypeValue(chain.finishType),
        builderPriceTier: builderPriceTierValue(
          chain.builderPriceTier ?? chain.builder_price_tier,
        ),
        selectedSize: nullableStringValue(
          chain.selectedSize ?? chain.selected_size,
        ),
        sizeLabel: nullableStringValue(chain.sizeLabel ?? chain.size_label),
      },
      chainLength: nullableStringValue(item.chainLength ?? item.chain_length),
      connector: item.connector
        ? normalizeBuilderItem(item.connector, -1)
        : null,
      selectedItems: selectedItems.map(normalizeBuilderItem),
      pricingSummary: normalizeBuilderPricingSummary(item.pricingSummary),
    };
  }

  const productId = stringValue(item.productId ?? item.id ?? item.product_id);
  const selectedSize = nullableStringValue(item.selectedSize ?? item.selected_size);
  const customLength = nullableStringValue(
    item.customLength ?? item.custom_length ?? item.selected_custom_length,
  );

  return {
    cartItemId:
      stringValue(item.cartItemId) ||
      (productId
        ? `${productId}${selectedSize ? `-${selectedSize}` : ""}${
            customLength ? `-${customLength}` : ""
          }`
        : `invalid-cart-item-${index}`),
    itemType: "regular_product",
    productId,
    slug: stringValue(item.slug),
    name: stringValue(item.name),
    imageUrl: optionalStringValue(item.imageUrl ?? item.image_url),
    unitPrice: numberValue(item.unitPrice ?? item.price ?? item.unit_price),
    quantity: normalizeQuantity(numberValue(item.quantity, 1)),
    stockQuantity:
      item.stockQuantity === undefined && item.stock_quantity === undefined
        ? undefined
        : numberValue(item.stockQuantity ?? item.stock_quantity),
    lowStockThreshold:
      item.lowStockThreshold === undefined && item.low_stock_threshold === undefined
        ? undefined
        : numberValue(item.lowStockThreshold ?? item.low_stock_threshold),
    finishType: finishTypeValue(item.finishType),
    selectedSize,
    sizeLabel: nullableStringValue(item.sizeLabel ?? item.size_label),
    customLength,
    customLengthLabel: nullableStringValue(
      item.customLengthLabel ?? item.custom_length_label,
    ),
  };
}

function normalizeStoredCartItems(values: unknown[]) {
  const seenCartItemIds = new Set<string>();

  return values.map((value, index) => {
    const item = normalizeStoredCartItem(value, index);
    const key = getCartItemKey(item);

    if (item.itemType === "custom_necklace" && seenCartItemIds.has(key)) {
      const cartItemId = createCartItemId("custom-necklace");

      item.cartItemId = cartItemId;
      item.productId = cartItemId;
    }

    seenCartItemIds.add(getCartItemKey(item));
    return item;
  });
}

export function writeCart(items: CartItem[]) {
  const nextCart = JSON.stringify(items);

  if (window.localStorage.getItem(cartStorageKey) === nextCart) {
    return;
  }

  window.localStorage.setItem(cartStorageKey, nextCart);
  window.dispatchEvent(new CustomEvent(cartUpdatedEvent, { detail: items }));
}

export function addCartItem(input: CartInput) {
  const cart = readCart();
  const existing = cart.find(
    (item): item is RegularCartItem =>
      isRegularCartItem(item) &&
      item.productId === input.productId &&
      (item.selectedSize ?? null) === (input.selectedSize ?? null) &&
      (item.customLength ?? null) === (input.customLength ?? null),
  );

  if (existing) {
    existing.quantity = normalizeQuantity(
      existing.quantity + (input.quantity ?? 1),
      existing.stockQuantity,
    );
  } else {
    cart.push({
      ...input,
      cartItemId:
        input.cartItemId ??
        `${input.productId}${input.selectedSize ? `-${input.selectedSize}` : ""}${
          input.customLength ? `-${input.customLength}` : ""
        }`,
      quantity: normalizeQuantity(input.quantity ?? 1, input.stockQuantity),
    });
  }

  writeCart(cart);
  return cart;
}

export function addCustomNecklaceItem(input: CustomNecklaceCartItem) {
  const cart = readCart();
  const inputCartItemId = input.cartItemId;
  const cartItemId =
    inputCartItemId && !cart.some((item) => getCartItemKey(item) === inputCartItemId)
      ? inputCartItemId
      : createCartItemId("custom-necklace");

  cart.push({
    ...input,
    cartItemId,
    productId: cartItemId,
  });
  writeCart(cart);
  return cart;
}

export function getCartItemKey(item: CartItem) {
  return item.cartItemId ?? item.productId;
}

export function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const cart: CartItem[] = readCart().map((item) => {
    if (!isRegularCartItem(item) || getCartItemKey(item) !== cartItemId) {
      return item;
    }

    return {
      ...item,
      quantity: normalizeQuantity(quantity, item.stockQuantity),
    };
  });

  writeCart(cart);
  return cart;
}

export function removeCartItem(cartItemId: string) {
  const cart = readCart().filter((item) => getCartItemKey(item) !== cartItemId);
  writeCart(cart);
  return cart;
}

export function clearCart() {
  writeCart([]);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce(
    (subtotal, item) =>
      subtotal +
      (item.itemType === "custom_necklace"
        ? item.unitPrice
        : item.unitPrice * item.quantity),
    0,
  );
}
