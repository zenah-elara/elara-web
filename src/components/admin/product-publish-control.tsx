"use client";

import { useState } from "react";
import { setProductPublished } from "@/features/admin/catalog/actions";

export function ProductPublishControl({
  productId,
  isPublished,
}: {
  productId: string;
  isPublished: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!isPublished) {
    return (
      <form action={setProductPublished.bind(null, productId, true)}>
        <button className="rounded-full bg-[#d38aa0] px-3 py-1 text-xs font-semibold text-white">
          Publish product
        </button>
      </form>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setConfirming(true)} className="rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-semibold text-[#8f4f68]">
        Unpublish product
      </button>
      {confirming ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#532b45]/25 px-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl border border-[#efccd4] bg-[#fffaf8] p-6 shadow-[0_24px_70px_rgba(122,63,99,0.2)]">
            <h2 className="text-xl font-semibold text-[#7A3F63]">Unpublish this product?</h2>
            <p className="mt-3 text-sm leading-6 text-[#8f5574]">This product will be hidden from customers, but all Admin data will be kept.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirming(false)} className="rounded-full border border-[#efccd4] bg-white px-4 py-2 text-sm font-semibold text-[#7A3F63]">Cancel</button>
              <form action={setProductPublished.bind(null, productId, false)}>
                <button className="rounded-full bg-[#d38aa0] px-4 py-2 text-sm font-semibold text-white">Unpublish</button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
