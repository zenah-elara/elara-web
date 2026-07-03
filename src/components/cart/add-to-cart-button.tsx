"use client";

import { useState } from "react";
import type { CartInput } from "@/features/cart/types";
import { addCartItem } from "@/features/cart/utils";

type AddToCartButtonProps = {
  item: CartInput;
  className?: string;
  disabled?: boolean;
  label?: string;
};

export function AddToCartButton({
  item,
  className = "",
  disabled = false,
  label = "Add to cart",
}: AddToCartButtonProps) {
  const [message, setMessage] = useState("");
  const isOutOfStock =
    typeof item.stockQuantity === "number" && item.stockQuantity <= 0;

  return (
    <div>
      <button
        type="button"
        disabled={isOutOfStock || disabled}
        onClick={() => {
          addCartItem(item);
          setMessage("Added to cart");
          window.setTimeout(() => setMessage(""), 1800);
        }}
        className={`inline-flex min-h-10 items-center justify-center rounded-full bg-[#d38aa0] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#c77992] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 ${className}`}
      >
        {isOutOfStock ? "Out of stock" : label}
      </button>
      {message ? (
        <p className="mt-2 text-xs font-semibold text-[#7A3F63]">{message}</p>
      ) : null}
    </div>
  );
}
