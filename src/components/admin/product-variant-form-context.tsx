"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type ProductVariantModeContextValue = {
  hasVariants: boolean;
  setHasVariants: (value: boolean) => void;
};

const ProductVariantModeContext = createContext<ProductVariantModeContextValue | null>(null);

export function ProductVariantFormProvider({
  defaultHasVariants,
  children,
}: {
  defaultHasVariants: boolean;
  children: ReactNode;
}) {
  const [hasVariants, setHasVariants] = useState(defaultHasVariants);

  return (
    <ProductVariantModeContext.Provider value={{ hasVariants, setHasVariants }}>
      {children}
    </ProductVariantModeContext.Provider>
  );
}

export function useProductVariantMode() {
  const context = useContext(ProductVariantModeContext);

  if (!context) {
    throw new Error("Product variant fields must be inside ProductVariantFormProvider.");
  }

  return context;
}

export function NonVariantOnly({ children }: { children: ReactNode }) {
  const { hasVariants } = useProductVariantMode();
  return hasVariants ? null : children;
}

export function VariantOnly({ children }: { children: ReactNode }) {
  const { hasVariants } = useProductVariantMode();
  return hasVariants ? children : null;
}
