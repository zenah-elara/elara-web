"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/data";
import { useCartItems } from "@/features/cart/store";
import {
  FinishBadge,
  getFinishLabel,
  type ProductFinishType,
} from "@/components/finish-badge";
import { getCustomerStockLabel } from "@/components/stock-badge";
import {
  clearCart,
  getCartItemKey,
  getCartSubtotal,
  removeCartItem,
  updateCartItemQuantity,
} from "@/features/cart/utils";
import type { CustomNecklaceCartItem } from "@/features/cart/types";

function getCustomMaterialRows(item: CustomNecklaceCartItem) {
  const rows: { label: string; name: string; finishType: ProductFinishType }[] =
    [];

  if (item.chain.finishType) {
    rows.push({
      label: "Chain",
      name: item.chain.name,
      finishType: item.chain.finishType,
    });
  }

  if (item.connector?.finishType) {
    rows.push({
      label: "Connector",
      name: item.connector.name,
      finishType: item.connector.finishType,
    });
  }

  item.selectedItems.forEach((selected) => {
    if (!selected.finishType) return;

    rows.push({
      label: selected.productType.replace("_", " "),
      name: selected.name,
      finishType: selected.finishType,
    });
  });

  return rows;
}

export function CartView() {
  const { items, isLoaded } = useCartItems();
  const subtotal = getCartSubtotal(items);

  if (!isLoaded) {
    return (
      <div className="mt-9 rounded-3xl boutique-card p-8 text-[#76504a]">
        Loading cart...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-9 rounded-3xl boutique-card p-8 text-center">
        <h2 className="text-2xl font-semibold text-[#7A3F63]">
          Your cart is empty
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#76504a]">
          Browse elara. collections and add your favorite pieces before sending
          an order request.
        </p>
        <Link
          href="/collections"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#c77992]"
        >
          Shop Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-9 grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={getCartItemKey(item)}
            className="grid gap-4 rounded-3xl boutique-card p-4 sm:grid-cols-[92px_1fr_auto]"
          >
            <div className="h-24 w-24 overflow-hidden rounded-2xl bg-[#fff1f6]">
              {(item.itemType === "custom_necklace"
                ? item.chain.imageUrl
                : item.imageUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    item.itemType === "custom_necklace"
                      ? item.chain.imageUrl
                      : item.imageUrl
                  }
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div>
              {item.itemType === "custom_necklace" ? (
                <p className="font-semibold text-[#7A3F63]">{item.name}</p>
              ) : (
                <Link
                  href={`/products/${item.slug}`}
                  className="font-semibold text-[#7A3F63] hover:text-[#9A4F78]"
                >
                  {item.name}
                </Link>
              )}
              <p className="mt-2 text-sm text-[#76504a]">
                {item.itemType === "custom_necklace"
                  ? item.chainLength
                    ? `${item.chain.name} · ${item.chainLength}`
                    : item.chain.name
                  : `${formatPrice(item.unitPrice)} each`}
              </p>
              {item.itemType !== "custom_necklace" && item.selectedSize ? (
                <p className="mt-1 text-xs font-semibold text-[#7A3F63]">
                  {item.sizeLabel ?? "Size"}: {item.selectedSize}
                </p>
              ) : null}
              {item.itemType === "custom_necklace" && item.chain.finishType ? (
                <div className="mt-2">
                  <FinishBadge finishType={item.chain.finishType} />
                </div>
              ) : item.itemType !== "custom_necklace" && item.finishType ? (
                <div className="mt-2">
                  <FinishBadge finishType={item.finishType} />
                </div>
              ) : null}
              {item.itemType === "custom_necklace" ? (
                <div className="mt-3 space-y-2 text-xs text-[#76504a]">
                  {item.pricingSummary ? (
                    <>
                      <div className="rounded-2xl bg-[#fff7fa] p-3">
                        <p className="font-semibold text-[#7A3F63]">
                          {item.pricingSummary.cartLabel}
                        </p>
                        <p className="mt-1">
                          Included items: {item.chain.name} +{" "}
                          {item.pricingSummary.includedItem.name}
                        </p>
                        <p className="mt-1">
                          Base: {formatPrice(item.pricingSummary.basePrice)}
                        </p>
                      </div>
                      {item.pricingSummary.addOns.length > 0 ? (
                        <div className="rounded-2xl bg-white/70 p-3">
                          <p className="font-semibold text-[#7A3F63]">
                            Add-ons
                          </p>
                          <ul className="mt-1 space-y-1">
                            {item.pricingSummary.addOns.map((addOn) => (
                              <li key={`${addOn.productId}-${addOn.label}`}>
                                {addOn.name}
                                {addOn.quantity > 1
                                  ? ` x ${addOn.quantity}`
                                  : ""}{" "}
                                · {addOn.label} ·{" "}
                                {formatPrice(addOn.lineTotal)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {getCustomMaterialRows(item).length > 0 ? (
                        <div className="rounded-2xl bg-[#fff8e8] p-3">
                          <p className="font-semibold text-[#7A3F63]">
                            Material summary
                          </p>
                          <ul className="mt-1 space-y-1">
                            {getCustomMaterialRows(item).map((row, index) => (
                              <li key={`${row.label}-${row.name}-${index}`}>
                                {row.label}: {row.name} ·{" "}
                                {getFinishLabel(row.finishType)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {item.connector ? (
                        <p>
                          <span className="font-semibold text-[#7A3F63]">
                            Connector:
                          </span>{" "}
                          {item.connector.name}
                        </p>
                      ) : null}
                      <p className="font-semibold text-[#7A3F63]">
                        {item.connector ? "Inside connector" : "Arrangement"}
                      </p>
                      <ol className="space-y-1">
                        {[...item.selectedItems]
                          .sort(
                            (a, b) => a.arrangementOrder - b.arrangementOrder,
                          )
                          .map((selected, index) => (
                            <li
                              key={`${selected.productId}-${selected.arrangementOrder}`}
                            >
                              {index + 1}. {selected.name}
                              {selected.quantity > 1
                                ? ` x ${selected.quantity}`
                                : ""}{" "}
                              · {selected.productType.replace("_", " ")}
                            </li>
                          ))}
                      </ol>
                    </>
                  )}
                </div>
              ) : typeof item.stockQuantity === "number" ? (
                <p className="mt-1 text-xs font-semibold text-[#9A4F78]">
                  {getCustomerStockLabel(
                    item.stockQuantity,
                    item.lowStockThreshold,
                  )}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {item.itemType !== "custom_necklace" ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        updateCartItemQuantity(
                          getCartItemKey(item),
                          item.quantity - 1,
                        )
                      }
                      className="h-9 w-9 rounded-full border border-[#D5A84F] bg-[#FFF8F3] text-[#7A3F63]"
                    >
                      -
                    </button>
                    <span className="min-w-10 text-center text-sm font-semibold text-[#7A3F63]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateCartItemQuantity(
                          getCartItemKey(item),
                          item.quantity + 1,
                        )
                      }
                      disabled={
                        typeof item.stockQuantity === "number" &&
                        item.quantity >= item.stockQuantity
                      }
                      className="h-9 w-9 rounded-full border border-[#D5A84F] bg-[#FFF8F3] text-[#7A3F63] disabled:opacity-45"
                    >
                      +
                    </button>
                  </>
                ) : (
                  <span className="rounded-full bg-[#fff1f6] px-3 py-2 text-xs font-semibold text-[#7A3F63]">
                    Quantity fixed at 1
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeCartItem(getCartItemKey(item))}
                  className="rounded-full bg-[#fff1f6] px-3 py-2 text-xs font-semibold text-rose"
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="text-right text-lg font-semibold text-[#7A3F63]">
              {formatPrice(
                item.itemType === "custom_necklace"
                  ? item.unitPrice
                  : item.unitPrice * item.quantity,
              )}
            </p>
          </article>
        ))}
      </div>
      <aside className="h-fit rounded-[2rem] border border-[#f0c9d6] bg-gradient-to-br from-[#ffe1ec] via-[#fff8fb] to-[#fff2d9] p-6 text-[#76504a] shadow-[0_24px_60px_rgba(201,130,149,0.16)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c6a15a]">
          Order summary
        </p>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between border-b border-[#efccd4] pb-3">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between border-b border-[#efccd4] pb-3">
            <span>Delivery</span>
            <span>Confirmed later</span>
          </div>
          <div className="flex justify-between pb-3 font-semibold text-[#7A3F63]">
            <span>Estimated total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
        </div>
        <Link
          href="/checkout"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#c77992]"
        >
          Proceed to Order Request
        </Link>
        <div className="mt-3 grid gap-2">
          <Link
            href="/collections"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#D5A84F] bg-[#FFF8F3] px-4 py-2 text-sm font-semibold text-[#7A3F63] hover:bg-[#FFEAF2]"
          >
            Continue shopping
          </Link>
          <button
            type="button"
            onClick={clearCart}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#fff1f6] px-4 py-2 text-sm font-semibold text-rose"
          >
            Clear cart
          </button>
        </div>
      </aside>
    </div>
  );
}
