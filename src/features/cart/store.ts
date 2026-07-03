"use client";

import { useSyncExternalStore } from "react";
import type { CartItem } from "./types";
import { cartStorageKey, cartUpdatedEvent, readCart } from "./utils";

const EMPTY_CART_ITEMS: CartItem[] = [];

let cachedRawCart: string | null = null;
let cachedCartItems: CartItem[] = EMPTY_CART_ITEMS;

function subscribeCart(callback: () => void) {
  window.addEventListener(cartUpdatedEvent, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(cartUpdatedEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

function getServerCartSnapshot(): CartItem[] {
  return EMPTY_CART_ITEMS;
}

function getClientCartSnapshot(): CartItem[] {
  const rawCart = window.localStorage.getItem(cartStorageKey);

  if (rawCart === cachedRawCart) {
    return cachedCartItems;
  }

  cachedRawCart = rawCart;
  cachedCartItems = readCart();

  return cachedCartItems;
}

export function useCartItems() {
  const items = useSyncExternalStore(
    subscribeCart,
    getClientCartSnapshot,
    getServerCartSnapshot,
  );

  return { items, isLoaded: true };
}
