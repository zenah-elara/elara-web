"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/button";
import { FinishBadge, getFinishLabel } from "@/components/finish-badge";
import { ProductImageGallery } from "@/components/product/product-image-gallery";
import { ProductPurchaseOptions } from "@/components/product/product-purchase-options";
import { StockBadge } from "@/components/stock-badge";
import type { CatalogProduct } from "@/features/catalog/types";
import { formatPrice, type ProductVariant } from "@/lib/data";
import { getMaterialCareInstruction, getMaterialNote } from "@/lib/materials";

export function ProductDetailExperience({ product }: { product: CatalogProduct }) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const handleVariantChange = useCallback((variant: ProductVariant | null) => {
    setSelectedVariant(variant);
  }, []);
  const sharedImages = product.images ?? [];
  const galleryImages = selectedVariant?.images.length ? selectedVariant.images : sharedImages;
  const effectiveMaterial = selectedVariant?.materialTypeOverride ?? product.finishType;
  const effectivePrice = selectedVariant?.priceOverride ?? product.price;
  const effectiveStock = selectedVariant?.stock ?? product.stock;
  const materialDetails = getMaterialNote(effectiveMaterial) ?? product.materialDetails;
  const careInstructions = getMaterialCareInstruction(effectiveMaterial) ?? product.careInstructions;

  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[0.95fr_1.05fr] lg:px-8">
      <div className="space-y-4">
        <ProductImageGallery key={selectedVariant?.id ?? "shared"} images={galleryImages} productName={product.name} />
        <div className="grid grid-cols-3 gap-3">
          {product.tags.slice(0, 3).map((tag) => (
            <div key={tag} className="rounded-2xl border border-[#efccd4] bg-white/70 p-3 text-center text-xs font-semibold text-[#76504a]">{tag}</div>
          ))}
        </div>
      </div>
      <div className="self-center rounded-[2rem] boutique-card p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{product.collection}</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-cocoa sm:text-5xl">{product.name}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p className="text-3xl font-semibold text-cocoa">{formatPrice(effectivePrice)}</p>
          <StockBadge stock={effectiveStock} lowStockThreshold={product.lowStockThreshold} />
        </div>
        <p className="mt-5 max-w-xl text-base leading-7 text-[#76504a]">{product.description} Add it to your preview cart, then send an order request so details can be confirmed through your preferred contact.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <FinishBadge finishType={effectiveMaterial} />
          {product.tags.map((tag) => <span key={tag} className="rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-semibold text-rose">{tag}</span>)}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <ProductPurchaseOptions
            item={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              imageUrl: product.imageUrl,
              unitPrice: product.price,
              stockQuantity: product.stock,
              lowStockThreshold: product.lowStockThreshold,
              finishType: product.finishType,
            }}
            variants={product.variants}
            onVariantChange={handleVariantChange}
            sizeLengthBehavior={product.sizeLengthBehavior}
            isSizeCustomizable={product.isSizeCustomizable}
            sizeOptions={product.sizeOptions}
            sizeLabel={product.sizeLabel}
            customLengthLabel={product.customLengthLabel}
            customLengthHelpText={product.customLengthHelpText}
            fixedSizeNote={product.fixedSizeNote}
          />
          <Button href="/checkout" variant="secondary">Request Order</Button>
        </div>
        {getFinishLabel(effectiveMaterial) ? (
          <div className="mt-8 rounded-2xl border border-[#e8c891] bg-[#fff8e8] p-4">
            <p className="text-sm font-semibold text-[#7A3F63]">Material</p>
            <div className="mt-3"><FinishBadge finishType={effectiveMaterial} /></div>
            <p className="mt-3 text-sm leading-6 text-[#76504a]">{materialDetails}</p>
            <p className="mt-4 text-sm font-semibold text-[#7A3F63]">Care instruction</p>
            <p className="mt-2 text-sm leading-6 text-[#76504a]">{careInstructions}</p>
          </div>
        ) : null}
        <div className="mt-6 rounded-2xl border border-[#efccd4] bg-white/70 p-4 text-sm leading-6 text-[#76504a]">Payment is not collected on-site yet. elara. will confirm your order, payment method, and delivery details after you submit a request.</div>
      </div>
    </section>
  );
}
