"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { submitOrderRequest } from "@/features/orders/actions";
import { useCartItems } from "@/features/cart/store";
import { clearCart, getCartSubtotal } from "@/features/cart/utils";
import { formatPrice } from "@/lib/data";
import { getFinishLabel } from "@/components/finish-badge";
import type { CustomNecklaceCartItem } from "@/features/cart/types";

function getCheckoutCustomMaterialSummary(item: CustomNecklaceCartItem) {
  return [
    item.chain.finishType
      ? `Chain: ${getFinishLabel(item.chain.finishType)}`
      : null,
    item.connector?.finishType
      ? `Connector: ${getFinishLabel(item.connector.finishType)}`
      : null,
    ...item.selectedItems.map((selected) =>
      selected.finishType
        ? `${selected.productType.replace("_", " ")}: ${getFinishLabel(
            selected.finishType,
          )}`
        : null,
    ),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function CheckoutView() {
  const router = useRouter();
  const { items, isLoaded } = useCartItems();
  const [message, setMessage] = useState("");
  const [deliveryOption, setDeliveryOption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const subtotal = getCartSubtotal(items);
  const isSubmittingOrder = isSubmitting || isPending;

  if (!isLoaded) {
    return (
      <div className="mt-9 rounded-3xl boutique-card p-8 text-[#76504a]">
        Loading checkout...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-9 rounded-3xl boutique-card p-8 text-center">
        <h2 className="text-2xl font-semibold text-[#7A3F63]">
          Your checkout is empty
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#76504a]">
          Add pieces to your cart before sending an order request.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/collections"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white"
          >
            Shop Collections
          </Link>
          <Link
            href="/cart"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D5A84F] bg-[#FFF8F3] px-5 py-2 text-sm font-semibold text-[#7A3F63]"
          >
            View Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-9 grid gap-6 lg:grid-cols-[1fr_340px]">
      <form
        className="grid gap-4 rounded-3xl boutique-card p-6 sm:grid-cols-2"
        action={(formData) => {
          if (isSubmittingOrder) {
            return;
          }

          formData.set("cart_json", JSON.stringify({ items }));
          setMessage("");
          setIsSubmitting(true);

          startTransition(async () => {
            let didRedirect = false;

            try {
              const result = await submitOrderRequest(formData);

              if (!result.success) {
                setMessage(result.message);
                return;
              }

              clearCart();
              didRedirect = true;
              router.push(
                `/checkout/success?orderNumber=${encodeURIComponent(
                  result.orderNumber ?? "",
                )}`,
              );
            } finally {
              if (!didRedirect) {
                setIsSubmitting(false);
              }
            }
          });
        }}
      >
        <input type="hidden" name="cart_json" />
        <label className="block">
          <span className="text-sm font-semibold text-[#7A3F63]">Full name</span>
          <input name="customer_name" required className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-[#7A3F63] outline-none" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[#7A3F63]">Contact number</span>
          <input name="contact_number" required className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-[#7A3F63] outline-none" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[#7A3F63]">Facebook profile link</span>
          <input name="facebook_link" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-[#7A3F63] outline-none" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[#7A3F63]">Instagram username</span>
          <input name="instagram_username" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-[#7A3F63] outline-none" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[#7A3F63]">Preferred contact method</span>
          <select name="preferred_contact_method" required defaultValue="" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-[#7A3F63] outline-none">
            <option value="" disabled>Choose one</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="phone">Phone</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[#7A3F63]">Delivery method</span>
          <select
            name="delivery_option"
            required
            defaultValue=""
            onChange={(event) => setDeliveryOption(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-[#7A3F63] outline-none"
          >
            <option value="" disabled>Choose one</option>
            <option value="grab_express">Bacolod Delivery - Grab Express</option>
            <option value="maxim">Bacolod Delivery - Maxim</option>
            <option value="jnt_express">Outside Bacolod Shipping - J&T Express</option>
            <option value="dropoff_store">Drop-off at agreed store</option>
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[#7A3F63]">
            {deliveryOption === "jnt_express"
              ? "Complete shipping address"
              : deliveryOption === "dropoff_store"
                ? "Agreed store or drop-off location"
                : "Bacolod delivery address or pin location"}
          </span>
          <textarea name="delivery_location" required rows={3} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-[#7A3F63] outline-none" />
          <span className="mt-2 block text-xs font-medium text-[#9A4F78]">
            {deliveryOption === "jnt_express"
              ? "For orders outside Bacolod. Shipping fee will be confirmed before payment."
              : deliveryOption === "dropoff_store"
                ? "We'll confirm the agreed drop-off point through your selected contact method."
                : "For Bacolod deliveries only. Delivery fee will be confirmed before payment."}
          </span>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[#7A3F63]">Order notes</span>
          <textarea name="order_notes" rows={4} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-[#7A3F63] outline-none" />
        </label>
        {message ? (
          <div className="rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4 text-sm font-semibold text-[#76504a] sm:col-span-2">
            {message}
          </div>
        ) : null}
        <button
          disabled={isSubmittingOrder}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(201,130,149,0.22)] disabled:opacity-60 sm:col-span-2"
        >
          {isSubmittingOrder ? "Submitting..." : "Submit Order Request"}
        </button>
      </form>
      <aside className="h-fit rounded-[2rem] border border-[#f0c9d6] bg-gradient-to-br from-[#ffe1ec] via-[#fff8fb] to-[#fff2d9] p-6 text-sm leading-6 text-[#76504a] shadow-[0_24px_60px_rgba(201,130,149,0.16)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c6a15a]">
          Order summary
        </p>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.cartItemId ?? item.productId}
              className="border-b border-[#efccd4] pb-3 last:border-b-0"
            >
              <div className="flex justify-between gap-3">
                <span>
                  {item.name}
                  {item.itemType === "custom_necklace"
                    ? ""
                    : ` x ${item.quantity}`}
                </span>
                <span>
                  {formatPrice(
                    item.itemType === "custom_necklace"
                      ? item.unitPrice
                      : item.unitPrice * item.quantity,
                  )}
                </span>
              </div>
              {item.itemType !== "custom_necklace" && item.selectedSize ? (
                <p className="mt-1 text-xs font-semibold text-[#7A3F63]">
                  {item.sizeLabel ?? "Size"}: {item.selectedSize}
                </p>
              ) : null}
              {item.itemType !== "custom_necklace" && item.finishType ? (
                <p className="mt-1 text-xs font-semibold text-[#7A3F63]">
                  Material: {getFinishLabel(item.finishType)}
                </p>
              ) : null}
              {item.itemType === "custom_necklace" ? (
                <div className="mt-2 text-xs leading-5 text-[#76504a]">
                  <p>
                    {item.chainLength
                      ? `${item.chain.name} · ${item.chainLength}`
                      : item.chain.name}
                  </p>
                  {item.connector ? (
                    <p>Connector: {item.connector.name}</p>
                  ) : null}
                  <p>
                    {item.connector ? "Inside connector" : "Arrangement"}:{" "}
                    {[...item.selectedItems]
                      .sort((a, b) => a.arrangementOrder - b.arrangementOrder)
                      .map((selected) => selected.name)
                      .join(" → ")}
                  </p>
                  {getCheckoutCustomMaterialSummary(item) ? (
                    <p>{getCheckoutCustomMaterialSummary(item)}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
          <div className="flex justify-between border-t border-[#efccd4] pt-3 font-semibold text-[#7A3F63]">
            <span>Estimated total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
        </div>
        <p className="mt-5 text-xs leading-5">
          Based in Bacolod. Local delivery uses Grab Express or Maxim; outside
          Bacolod shipping uses J&T Express.
        </p>
      </aside>
    </div>
  );
}
