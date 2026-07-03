"use client";

import { useState } from "react";
import { ImagePlaceholder } from "@/components/image-placeholder";
import type { ProductImage } from "@/lib/data";

type ProductImageGalleryProps = {
  images: ProductImage[];
  productName: string;
};

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  if (images.length === 0 || !activeImage) {
    return (
      <ImagePlaceholder
        label="Product photo coming soon"
        tone="cream"
        className="min-h-[520px] rounded-[2rem]"
      />
    );
  }

  const showControls = images.length > 1;

  function goToPrevious() {
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  }

  function goToNext() {
    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] bg-[#fff1f6] soft-ring">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage.imageUrl}
          alt={activeImage.altText ?? productName}
          className="h-full min-h-[520px] w-full object-cover"
        />
        {showControls ? (
          <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
            <button
              type="button"
              onClick={goToPrevious}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8b36a] bg-white/86 text-lg font-semibold text-[#7A3F63] shadow-sm"
              aria-label="Previous product image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8b36a] bg-white/86 text-lg font-semibold text-[#7A3F63] shadow-sm"
              aria-label="Next product image"
            >
              ›
            </button>
          </div>
        ) : null}
      </div>
      {showControls ? (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={image.id ?? image.imageUrl}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`overflow-hidden rounded-2xl border bg-[#fff1f6] ${
                index === activeIndex ? "border-[#d8b36a]" : "border-[#efccd4]"
              }`}
              aria-label={`View product image ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.imageUrl}
                alt={image.altText ?? productName}
                className="h-24 w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
