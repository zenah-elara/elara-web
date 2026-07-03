"use server";

import { randomUUID } from "crypto";
import { getSupabasePublicServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type {
  BuilderSelectedCartItem,
  CartItem,
  CustomNecklaceCartItem,
  RegularCartItem,
} from "@/features/cart/types";
import type { SubmitOrderResult } from "./types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];
type CustomNecklaceItemInsert =
  Database["public"]["Tables"]["custom_necklace_items"]["Insert"];
type CustomNecklaceCharmInsert =
  Database["public"]["Tables"]["custom_necklace_charms"]["Insert"];
type SafeSupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};
type CustomerFieldsResult =
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      customerName: string;
      contactNumber: string;
      facebookLink: string | null;
      instagramUsername: string | null;
      deliveryLocation: string;
      deliveryMethod: "bacolod_delivery" | "outside_bacolod_shipping" | "dropoff_store";
      courierService: "grab_express" | "maxim" | "jnt_express" | null;
      dropoffLocation: string | null;
      shippingAddress: string | null;
      preferredContactMethod: "facebook" | "instagram" | "phone";
      orderNotes: string | null;
    };

const disconnectedMessage =
  "Order requests are not connected yet. Please contact us directly through Facebook or Instagram.";
const orderFailureMessage =
  "We couldn't submit your order request. Please try again or contact us through Instagram/Facebook.";
const invalidCartMessage =
  "Some cart items are missing product details. Please remove and add them again.";

function logOrderFailure(
  step: string,
  error: unknown,
  context?: {
    cartItemsCount?: number;
    itemTypes?: string[];
  },
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const safeError = error as SafeSupabaseError | null;

  console.warn(`[orders] ${step} failed`, {
    code: safeError?.code,
    message: safeError?.message,
    details: safeError?.details,
    hint: safeError?.hint,
    cartItemsCount: context?.cartItemsCount,
    itemTypes: context?.itemTypes,
  });
}

function logCheckoutStep(
  step: string,
  context?: {
    customNecklaceDetailsInserted?: boolean;
    customNecklaceRowsAttempted?: number;
    customCharmRowsAttempted?: number;
    failureReasonCode?: string;
    itemTypes?: string[];
    orderInsertSucceeded?: boolean;
    orderItemsAttempted?: number;
    orderItemsInserted?: number;
    result?: "success" | "failure";
  },
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info(`[orders] checkout ${step}`, context);
}

function logInvalidCartItems(cartItems: CartItem[]) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.warn(
    "[orders] invalid cart items",
    cartItems
      .map((item, index) => ({
        index,
        itemType: item.itemType ?? "regular_product",
        keys: Object.keys(item).sort(),
        valid:
          item.itemType === "custom_necklace"
            ? isValidCustomNecklaceItem(item)
            : isValidRegularItem(item as RegularCartItem),
      }))
      .filter((item) => !item.valid),
  );
}

async function cleanupIncompleteOrder(
  supabase: NonNullable<ReturnType<typeof getSupabasePublicServerClient>>,
  orderId: string,
) {
  const { error } = await supabase.from("orders").delete().eq("id", orderId);

  if (error) {
    logOrderFailure("cleanup incomplete order", error);
  }
}

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function generateOrderNumber() {
  const timestamp = new Date()
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `ELARA-${timestamp}-${suffix}`;
}

function parseCartItems(formData: FormData): CartItem[] {
  try {
    const parsed = JSON.parse(clean(formData.get("cart_json"))) as {
      items?: CartItem[];
    };

    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function hasValidPrice(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isValidSelectedItem(item: BuilderSelectedCartItem) {
  return (
    Boolean(item.productId) &&
    Boolean(item.name) &&
    hasValidPrice(item.price) &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

function isValidRegularItem(item: RegularCartItem) {
  return (
    Boolean(item.productId) &&
    Boolean(item.name) &&
    hasValidPrice(item.unitPrice) &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

function isValidCustomNecklaceItem(item: CustomNecklaceCartItem) {
  return (
    hasValidPrice(item.unitPrice) &&
    Boolean(item.chain?.productId) &&
    Boolean(item.chain?.name) &&
    hasValidPrice(item.chain?.price) &&
    Array.isArray(item.selectedItems) &&
    item.selectedItems.length > 0 &&
    item.selectedItems.every(isValidSelectedItem) &&
    (!item.connector || isValidSelectedItem(item.connector))
  );
}

function validateCartItems(cartItems: CartItem[]) {
  return cartItems.every((item) =>
    item.itemType === "custom_necklace"
      ? isValidCustomNecklaceItem(item)
      : isValidRegularItem(item as RegularCartItem),
  );
}

function getCartLineTotal(item: CartItem) {
  return item.itemType === "custom_necklace"
    ? item.unitPrice
    : item.unitPrice * item.quantity;
}

function getRequiredProductQuantities(cartItems: CartItem[]) {
  const quantities = new Map<string, { name: string; quantity: number }>();

  function add(productId: string, name: string, quantity: number) {
    const existing = quantities.get(productId);
    quantities.set(productId, {
      name,
      quantity: (existing?.quantity ?? 0) + quantity,
    });
  }

  cartItems.forEach((item) => {
    if (item.itemType === "custom_necklace") {
      add(item.chain.productId, item.chain.name, 1);
      if (item.connector?.productId) {
        add(item.connector.productId, item.connector.name, item.connector.quantity);
      }
      item.selectedItems.forEach((selected) => {
        add(selected.productId, selected.name, selected.quantity);
      });
      return;
    }

    add(item.productId, item.name, item.quantity);
  });

  return quantities;
}

function validateCustomerFields(formData: FormData): CustomerFieldsResult {
  const customerName = clean(formData.get("customer_name"));
  const contactNumber = clean(formData.get("contact_number"));
  const facebookLink = clean(formData.get("facebook_link"));
  const instagramUsername = clean(formData.get("instagram_username"));
  const deliveryLocation = clean(formData.get("delivery_location"));
  const deliveryOption = clean(formData.get("delivery_option"));
  const preferredContactMethod = clean(formData.get("preferred_contact_method"));
  const orderNotes = clean(formData.get("order_notes"));

  if (!customerName || !contactNumber) {
    return {
      success: false,
      error: "Please complete your name and contact number.",
    };
  }

  if (!["facebook", "instagram", "phone"].includes(preferredContactMethod)) {
    return {
      success: false,
      error: "Please choose your preferred contact method.",
    };
  }

  const deliveryConfig = {
    grab_express: {
      deliveryMethod: "bacolod_delivery",
      courierService: "grab_express",
      error: "Please enter your Bacolod delivery address or pin location.",
    },
    maxim: {
      deliveryMethod: "bacolod_delivery",
      courierService: "maxim",
      error: "Please enter your Bacolod delivery address or pin location.",
    },
    jnt_express: {
      deliveryMethod: "outside_bacolod_shipping",
      courierService: "jnt_express",
      error: "Please enter your complete shipping address.",
    },
    dropoff_store: {
      deliveryMethod: "dropoff_store",
      courierService: null,
      error: "Please enter the agreed store or drop-off location.",
    },
  } as const;

  const config =
    deliveryOption in deliveryConfig
      ? deliveryConfig[deliveryOption as keyof typeof deliveryConfig]
      : null;

  if (!config) {
    return {
      success: false,
      error: "Please choose a delivery method.",
    };
  }

  if (!deliveryLocation) {
    return {
      success: false,
      error: config.error,
    };
  }

  return {
    success: true,
    customerName,
    contactNumber,
    facebookLink: facebookLink || null,
    instagramUsername: instagramUsername || null,
    deliveryLocation:
      config.deliveryMethod === "bacolod_delivery" ? deliveryLocation : "",
    shippingAddress:
      config.deliveryMethod === "outside_bacolod_shipping"
        ? deliveryLocation
        : null,
    dropoffLocation:
      config.deliveryMethod === "dropoff_store" ? deliveryLocation : null,
    deliveryMethod: config.deliveryMethod,
    courierService: config.courierService,
    preferredContactMethod: preferredContactMethod as
      | "facebook"
      | "instagram"
      | "phone",
    orderNotes: orderNotes || null,
  };
}

export async function submitOrderRequest(
  formData: FormData,
): Promise<SubmitOrderResult> {
  const supabase = getSupabasePublicServerClient();

  if (!supabase) {
    logCheckoutStep("result", {
      failureReasonCode: "supabase_not_configured",
      result: "failure",
    });
    return { success: false, message: disconnectedMessage };
  }

  const customerFields = validateCustomerFields(formData);

  if (!customerFields.success) {
    logCheckoutStep("result", {
      failureReasonCode: "invalid_customer_fields",
      result: "failure",
    });
    return { success: false, message: customerFields.error };
  }

  const cartItems = parseCartItems(formData);
  const itemTypes = cartItems.map((item) => item.itemType ?? "regular_product");

  if (cartItems.length === 0) {
    logCheckoutStep("result", {
      failureReasonCode: "empty_cart",
      result: "failure",
    });
    return { success: false, message: "Your cart is empty." };
  }

  if (!validateCartItems(cartItems)) {
    logInvalidCartItems(cartItems);
    logCheckoutStep("result", {
      failureReasonCode: "invalid_cart_items",
      itemTypes,
      result: "failure",
    });
    return { success: false, message: invalidCartMessage };
  }

  const requiredQuantities = getRequiredProductQuantities(cartItems);
  const productIds = [...requiredQuantities.keys()];
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, name, is_active, stock_quantity")
    .in("id", productIds);

  if (productError || !products) {
    logOrderFailure("products availability check", productError);
    logCheckoutStep("result", {
      failureReasonCode: "product_availability_check_failed",
      itemTypes,
      result: "failure",
    });
    return {
      success: false,
      message: "Order request could not be checked. Please try again.",
    };
  }

  const productMap = new Map(
    (products as Pick<
      ProductRow,
      "id" | "name" | "is_active" | "stock_quantity"
    >[]).map((product) => [product.id, product]),
  );

  for (const [productId, required] of requiredQuantities) {
    const product = productMap.get(productId);

    if (!product || !product.is_active) {
      logCheckoutStep("result", {
        failureReasonCode: "inactive_or_missing_product",
        itemTypes,
        result: "failure",
      });
      return {
        success: false,
        message: `${required.name} is no longer available. Please remove it from your cart.`,
      };
    }

    if (required.quantity > product.stock_quantity) {
      logCheckoutStep("result", {
        failureReasonCode: "insufficient_stock",
        itemTypes,
        result: "failure",
      });
      return {
        success: false,
        message: `${required.name} is not available in the selected quantity.`,
      };
    }
  }

  const subtotal = cartItems.reduce(
    (total, item) => total + getCartLineTotal(item),
    0,
  );
  const orderId = randomUUID();
  const orderNumber = generateOrderNumber();

  const orderPayload: OrderInsert = {
    id: orderId,
    order_number: orderNumber,
    customer_name: customerFields.customerName,
    contact_number: customerFields.contactNumber,
    facebook_link: customerFields.facebookLink,
    instagram_username: customerFields.instagramUsername,
    delivery_location: customerFields.deliveryLocation,
    delivery_method: customerFields.deliveryMethod,
    courier_service: customerFields.courierService,
    shipping_address: customerFields.shippingAddress,
    dropoff_location: customerFields.dropoffLocation,
    preferred_contact_method: customerFields.preferredContactMethod,
    order_notes: customerFields.orderNotes,
    subtotal,
    estimated_total: subtotal,
  };

  const { error: orderError } = await supabase
    .from("orders")
    .insert(orderPayload as never);

  logCheckoutStep("order insert", {
    itemTypes,
    orderInsertSucceeded: !orderError,
  });

  if (orderError) {
    logOrderFailure("orders insert", orderError, {
      cartItemsCount: cartItems.length,
      itemTypes,
    });
    logCheckoutStep("result", {
      failureReasonCode: "order_insert_failed",
      itemTypes,
      orderInsertSucceeded: false,
      result: "failure",
    });
    return {
      success: false,
      message: orderFailureMessage,
    };
  }

  const orderItems: OrderItemInsert[] = cartItems.map((item) => ({
    id: randomUUID(),
    order_id: orderId,
    product_id:
      item.itemType === "custom_necklace" ? null : item.productId,
    item_type:
      item.itemType === "custom_necklace"
        ? ("custom_necklace" as const)
        : ("regular_product" as const),
    item_name:
      item.itemType === "custom_necklace"
        ? "Build Your Elara Piece"
        : item.name,
    selected_size:
      item.itemType === "custom_necklace" ? null : item.selectedSize ?? null,
    unit_price: item.unitPrice,
    quantity: item.itemType === "custom_necklace" ? 1 : item.quantity,
    line_total: getCartLineTotal(item),
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems as never[]);

  if (itemsError) {
    logOrderFailure("order_items insert", itemsError, {
      cartItemsCount: cartItems.length,
      itemTypes,
    });
    await cleanupIncompleteOrder(supabase, orderId);
    logCheckoutStep("result", {
      failureReasonCode: "order_items_insert_failed",
      itemTypes,
      orderInsertSucceeded: true,
      orderItemsAttempted: orderItems.length,
      result: "failure",
    });
    return {
      success: false,
      message: orderFailureMessage,
    };
  }

  logCheckoutStep("order_items insert", {
    itemTypes,
    orderItemsAttempted: orderItems.length,
    orderItemsInserted: orderItems.length,
  });

  const customNecklaceRows: CustomNecklaceItemInsert[] = [];
  const customCharmRows: CustomNecklaceCharmInsert[] = [];
  const customNecklaceCartItems = cartItems.filter(
    (item): item is CustomNecklaceCartItem =>
      item.itemType === "custom_necklace",
  );
  const expectedCustomCharmRows = customNecklaceCartItems.reduce(
    (total, item) =>
      total + item.selectedItems.length + (item.connector ? 1 : 0),
    0,
  );

  cartItems.forEach((item, index) => {
    if (item.itemType !== "custom_necklace") {
      return;
    }

    const orderItemId = orderItems[index]?.id;

    if (!orderItemId) {
      return;
    }

    const customNecklaceItemId = randomUUID();
    customNecklaceRows.push({
      id: customNecklaceItemId,
      order_item_id: orderItemId,
      chain_product_id: item.chain.productId,
      chain_name: item.chain.name,
      chain_length: item.chainLength,
      chain_price: item.chain.price,
    });
    customCharmRows.push(
      ...(item.connector
        ? [
            {
              custom_necklace_item_id: customNecklaceItemId,
              charm_product_id: item.connector.productId,
              charm_name: item.connector.name,
              charm_price: item.connector.price,
              product_type: "connector" as const,
              quantity: item.connector.quantity,
              arrangement_order: -1,
            },
          ]
        : []),
      ...item.selectedItems.map((selected, selectedIndex) => ({
        custom_necklace_item_id: customNecklaceItemId,
        charm_product_id: selected.productId,
        charm_name: selected.name,
        charm_price: selected.price,
        product_type: selected.productType,
        quantity: selected.quantity,
        arrangement_order: selected.arrangementOrder ?? selectedIndex,
      })),
    );
  });

  if (
    customNecklaceRows.length !== customNecklaceCartItems.length ||
    customCharmRows.length !== expectedCustomCharmRows
  ) {
    logOrderFailure("custom necklace row preparation", {
      code: "custom_row_preparation_mismatch",
      message: "Prepared custom necklace rows did not match cart items.",
    });
    await cleanupIncompleteOrder(supabase, orderId);
    logCheckoutStep("result", {
      customCharmRowsAttempted: customCharmRows.length,
      customNecklaceRowsAttempted: customNecklaceRows.length,
      failureReasonCode: "custom_row_preparation_mismatch",
      itemTypes,
      orderInsertSucceeded: true,
      orderItemsAttempted: orderItems.length,
      orderItemsInserted: orderItems.length,
      result: "failure",
    });
    return {
      success: false,
      message: orderFailureMessage,
    };
  }

  if (customNecklaceRows.length > 0) {
    const { error: customItemsError } = await supabase
      .from("custom_necklace_items")
      .insert(customNecklaceRows as never[]);

    if (customItemsError) {
      logOrderFailure("custom_necklace_items insert", customItemsError, {
        cartItemsCount: cartItems.length,
        itemTypes,
      });
      await cleanupIncompleteOrder(supabase, orderId);
      logCheckoutStep("result", {
        customCharmRowsAttempted: customCharmRows.length,
        customNecklaceRowsAttempted: customNecklaceRows.length,
        failureReasonCode: "custom_necklace_items_insert_failed",
        itemTypes,
        orderInsertSucceeded: true,
        orderItemsAttempted: orderItems.length,
        orderItemsInserted: orderItems.length,
        result: "failure",
      });
      return {
        success: false,
        message: orderFailureMessage,
      };
    }
  }

  if (customCharmRows.length > 0) {
    const { error: customCharmsError } = await supabase
      .from("custom_necklace_charms")
      .insert(customCharmRows as never[]);

    if (customCharmsError) {
      logOrderFailure("custom_necklace_charms insert", customCharmsError, {
        cartItemsCount: cartItems.length,
        itemTypes,
      });
      await cleanupIncompleteOrder(supabase, orderId);
      logCheckoutStep("result", {
        customCharmRowsAttempted: customCharmRows.length,
        customNecklaceRowsAttempted: customNecklaceRows.length,
        failureReasonCode: "custom_necklace_charms_insert_failed",
        itemTypes,
        orderInsertSucceeded: true,
        orderItemsAttempted: orderItems.length,
        orderItemsInserted: orderItems.length,
        result: "failure",
      });
      return {
        success: false,
        message: orderFailureMessage,
      };
    }
  }

  logCheckoutStep("result", {
    customCharmRowsAttempted: customCharmRows.length,
    customNecklaceDetailsInserted: customNecklaceRows.length > 0,
    customNecklaceRowsAttempted: customNecklaceRows.length,
    itemTypes,
    orderInsertSucceeded: true,
    orderItemsAttempted: orderItems.length,
    orderItemsInserted: orderItems.length,
    result: "success",
  });

  return {
    success: true,
    message: "Order request submitted.",
    orderId,
    orderNumber,
  };
}
