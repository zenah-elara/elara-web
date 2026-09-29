"use client";

import { useRef, useState, useTransition } from "react";
import { attachProductImage, removeProductImage } from "@/features/admin/catalog/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ImageValue = { id: string; imageUrl: string; altText?: string | null };
const maxBytes = 8 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

export function ProductImageUploader({ productId, productName, initialImages }: { productId?: string; productName: string; initialImages: ImageValue[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [images, setImages] = useState(initialImages);
  const [message, setMessage] = useState("Choose photos to upload.");
  const [isError, setIsError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  if (!productId) return <p className="text-sm text-[#76504a]">Save the product first before uploading photos.</p>;
  const savedProductId = productId;

  async function upload() {
    if (!files.length || uploading || pending) return;
    if (files.some((file) => file.size > maxBytes)) { setIsError(true); setMessage("This image is too large. Please upload an image under 8 MB."); return; }
    if (files.some((file) => !allowedTypes.includes(file.type))) { setIsError(true); setMessage("This file type is not supported. Please use JPG, PNG, or WebP."); return; }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setIsError(true); setMessage("The image could not be uploaded. Please try again."); return; }
    setUploading(true); setIsError(false); setMessage("Uploading...");
    const uploaded: { imageUrl: string; storagePath: string }[] = [];
    try {
      for (const [index, file] of files.entries()) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `products/${savedProductId}/shared/${Date.now()}-${index}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        uploaded.push({ imageUrl: supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl, storagePath: path });
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.error("[admin products] image upload failed", error);
      setUploading(false); setIsError(true); setMessage("The image could not be uploaded. Please try again."); return;
    }
    setUploading(false);
    startTransition(async () => {
      const attached: ImageValue[] = [];
      for (const [index, upload] of uploaded.entries()) {
        const data = new FormData(); data.set("image_url", upload.imageUrl); data.set("alt_text", `${productName} product photo`);
        const result = await attachProductImage(savedProductId, data);
        if (!result.success || !result.image) {
          await supabase.storage.from("product-images").remove(uploaded.slice(index).map((item) => item.storagePath));
          setImages((current) => [...current, ...attached]); setIsError(true); setMessage("The image uploaded, but it could not be attached to this product."); return;
        }
        attached.push(result.image);
      }
      setImages((current) => [...current, ...attached]); setFiles([]); if (inputRef.current) inputRef.current.value = "";
      setIsError(false); setMessage("Photo uploaded.");
    });
  }

  function remove(id: string) { startTransition(async () => { const result = await removeProductImage(savedProductId, id); if (!result.success) { setIsError(true); setMessage(result.message); return; } setImages((current) => current.filter((image) => image.id !== id)); setIsError(false); setMessage("Photo removed."); }); }

  return <div className="mt-5">
    <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading || pending} onChange={(event) => setFiles([...(event.target.files ?? [])])} className="block w-full text-sm text-[#76504a]" />
    <button type="button" onClick={upload} disabled={!files.length || uploading || pending} className="mt-3 rounded-full bg-[#d38aa0] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{uploading || pending ? "Uploading..." : "Upload photos"}</button>
    <p className={`mt-2 text-xs font-semibold ${isError ? "text-[#a04462]" : "text-[#447451]"}`}>{message}</p>
    {images.length ? <div className="mt-4 flex flex-wrap gap-3">{images.map((image) => <div key={image.id} className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.imageUrl} alt={image.altText ?? productName} className="h-20 w-20 rounded-xl object-cover" />
      <button type="button" onClick={() => remove(image.id)} disabled={pending} aria-label={`Remove ${productName} photo`} className="absolute -right-1 -top-1 h-6 w-6 rounded-full bg-[#7A3F63] text-white">×</button>
    </div>)}</div> : null}
  </div>;
}
