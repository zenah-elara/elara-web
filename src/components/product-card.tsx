import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatPrice, type Product } from "@/lib/data";
import { FinishBadge } from "./finish-badge";
import { ImagePlaceholder } from "./image-placeholder";
import { StockBadge } from "./stock-badge";

export function ProductCard({ product }: { product: Product }) {
  const requiresProductOptions =
    (product.sizeLengthBehavior && product.sizeLengthBehavior !== "none") ||
    (product.isSizeCustomizable && Boolean(product.sizeOptions?.length));

  return (
    <article className="group relative overflow-hidden rounded-[2.5rem] border border-[#f2c8d5] bg-[linear-gradient(180deg,#fffdf8_0%,#fff4f8_100%)] p-3 shadow-[0_20px_48px_rgba(211,140,157,0.16)] transition hover:-translate-y-1 hover:border-[#E2B4C1] hover:shadow-[0_30px_70px_rgba(211,140,157,0.24)]">
      <div className="pointer-events-none absolute right-6 top-6 h-2 w-2 rounded-full bg-white/86 shadow-[18px_10px_0_rgba(251,230,238,0.95),34px_-4px_0_rgba(255,255,255,0.72)]" />
      <Link href={`/products/${product.slug}`} className="block">
        {product.imageUrl ? (
          <div className="min-h-64 overflow-hidden rounded-[2rem] bg-[#fff1f6] ring-1 ring-[#f2c8d5] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.68)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              className="h-64 w-full object-cover transition duration-300 group-hover:scale-[1.025]"
            />
          </div>
        ) : (
          <ImagePlaceholder
            label="Product photo coming soon"
            className="min-h-64"
          />
        )}
      </Link>
      <div className="relative px-2 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D38C9D]">
              {product.collection}
            </p>
            <Link href={`/products/${product.slug}`}>
              <h3 className="mt-2 text-lg font-semibold text-[#A55166] group-hover:text-[#D38C9D]">
                {product.name}
              </h3>
            </Link>
          </div>
          <StockBadge
            stock={product.stock}
            lowStockThreshold={product.lowStockThreshold}
          />
        </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6f3f52]">
          {product.description}
        </p>
        {product.finishType ? (
          <div className="mt-3">
            <FinishBadge finishType={product.finishType} />
          </div>
        ) : null}
        {product.sizeLengthBehavior && product.sizeLengthBehavior !== "none" ? (
          <p className="mt-2 text-xs font-semibold text-[#9A4F78]">
            {product.sizeLengthBehavior === "custom"
              ? "Custom length available"
              : product.sizeLengthBehavior === "preset_and_custom"
                ? "Sizes and custom length available"
                : product.sizeLabel?.toLowerCase().includes("length")
                  ? "Length options"
                  : "Sizes available"}
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-lg font-semibold text-[#A55166]">
            {formatPrice(product.price)}
          </p>
          <span className="rounded-full border border-[#f2c8d5] bg-[#fff1f6] px-3 py-1 text-xs font-semibold text-[#A55166]">
            {product.tags[0] ?? "gold"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          {requiresProductOptions ? (
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[#d38aa0] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c77992]"
            >
              Choose options
            </Link>
          ) : (
            <AddToCartButton
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
              className="w-full"
            />
          )}
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#f2c8d5] bg-white/82 px-4 py-2 text-sm font-semibold text-[#8f4968] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff2f6] hover:text-[#A55166]"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
