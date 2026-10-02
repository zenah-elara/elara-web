"use client";

import { useEffect, useRef, useState } from "react";
import type { CartInput } from "@/features/cart/types";
import { addCartItem, cartStorageKey } from "@/features/cart/utils";

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
  label = "Add to Cart",
}: AddToCartButtonProps) {
  const [status, setStatus] = useState<"idle" | "added" | "error">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processing = useRef(false);
  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);
  const isOutOfStock =
    typeof item.stockQuantity === "number" && item.stockQuantity <= 0;

  function add() {
    if (processing.current || disabled || isOutOfStock || status === "added") return;
    processing.current = true;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setStatus("idle");
    try {
      const previousCart = window.localStorage.getItem(cartStorageKey);
      addCartItem(item);
      // A stock-capped cart line can remain unchanged; do not claim it was added.
      if (window.localStorage.getItem(cartStorageKey) === previousCart) {
        setStatus("error");
        return;
      }
      setStatus("added");
      resetTimer.current = setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    } finally {
      processing.current = false;
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={isOutOfStock || disabled || status === "added"}
        onClick={add}
        className={`inline-flex min-h-10 items-center justify-center rounded-full bg-[#d38aa0] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#c77992] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 ${className}`}
      >
        {isOutOfStock ? "Out of stock" : disabled ? label : status === "added" ? "Added to Cart ✓" : label}
      </button>
      <p role="status" aria-live="polite" aria-atomic="true" className="mt-2 min-h-4 text-xs font-semibold text-[#7A3F63]">
        {status === "added"
          ? "Added to your cart."
          : status === "error"
            ? "This item could not be added to your cart. Please try again."
            : ""}
      </p>
    </div>
  );
}
