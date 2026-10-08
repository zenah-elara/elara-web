"use client";
import Image from "next/image";

import { useRef, useState, useTransition } from "react";
import {
  attachVariantProductImage,
  removeVariantProductImage,
} from "@/features/admin/catalog/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type VariantImage = {
  id: string;
  imageUrl: string;
  altText?: string | null;
};

const bucket = "product-images";
const maxBytes = 8 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

function safeFileName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() || "jpg";
  const base = name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "variant-image";
  return `${base}.${extension}`;
}

export function VariantImageUploader({
  productId,
  variantId,
  label,
  initialImages,
}: {
  productId?: string;
  variantId?: string;
  label: string;
  initialImages: VariantImage[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [images, setImages] = useState(initialImages);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!productId || !variantId) {
    return (
      <div className="mt-4 rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-3 text-xs font-medium text-[#76504a]">
        Save the product first before uploading variant photos.
      </div>
    );
  }
  const savedProductId = productId;
  const savedVariantId = variantId;

  function selectFiles(nextFiles: File[]) {
    setMessage("");
    setIsError(false);
    setFiles(nextFiles);
    setPreviewUrls(nextFiles.map((file) => URL.createObjectURL(file)));
  }

  async function upload() {
    if (isUploading || isPending || files.length === 0) return;

    const oversized = files.find((file) => file.size > maxBytes);
    if (oversized) {
      setIsError(true);
      setMessage("This image is too large. Please upload an image under 8 MB.");
      return;
    }
    const unsupported = files.find((file) => !allowedTypes.includes(file.type));
    if (unsupported) {
      setIsError(true);
      setMessage("This file type is not supported. Please use JPG, PNG, or WebP.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsError(true);
      setMessage("Variant image storage is not configured yet.");
      return;
    }

    setIsUploading(true);
    setMessage("");
    setIsError(false);
    const uploaded: { imageUrl: string; storagePath: string }[] = [];

    try {
      for (const [index, file] of files.entries()) {
        const storagePath = `products/${savedProductId}/variants/${savedVariantId}/${crypto.randomUUID()}-${index}-${safeFileName(file.name)}`;
        const { error } = await supabase.storage.from(bucket).upload(storagePath, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type,
        });
        if (error) throw new Error(error.message);
        const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        uploaded.push({ imageUrl: data.publicUrl, storagePath });
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[admin variants] Storage upload failed.", {
          message: error instanceof Error ? error.message : "Unknown upload error",
          variantId: savedVariantId,
        });
      }
      setIsUploading(false);
      setIsError(true);
      setMessage("The image could not be uploaded. Please try again.");
      return;
    }

    setIsUploading(false);
    startTransition(async () => {
      const attached: VariantImage[] = [];
      try {
        for (const [uploadIndex, upload] of uploaded.entries()) {
          const formData = new FormData();
          formData.set("image_url", upload.imageUrl);
          formData.set("storage_path", upload.storagePath);
          formData.set("alt_text", `${label} product photo`);
          const result = await attachVariantProductImage(savedProductId, savedVariantId, formData);
          if (!result.success || !result.image) {
            await supabase.storage.from(bucket).remove(
              uploaded.slice(uploadIndex).map((item) => item.storagePath),
            );
            if (attached.length) setImages((current) => [...current, ...attached]);
            setIsError(true);
            setMessage("The image uploaded, but it could not be attached to this variant.");
            return;
          }
          attached.push(result.image);
        }
        setImages((current) => [...current, ...attached]);
        setFiles([]);
        setPreviewUrls([]);
        if (inputRef.current) inputRef.current.value = "";
        setIsError(false);
        setMessage("Photo uploaded.");
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[admin variants] Image attachment request failed.", {
            message: error instanceof Error ? error.message : "Unknown error",
            variantId: savedVariantId,
          });
        }
        setIsError(true);
        setMessage("The image uploaded, but it could not be attached to this variant.");
      }
    });
  }

  function remove(imageId: string) {
    if (isPending) return;
    startTransition(async () => {
      try {
        const result = await removeVariantProductImage(savedProductId, savedVariantId, imageId);
        if (!result.success) {
          setIsError(true);
          setMessage(result.message);
          return;
        }
        setImages((current) => current.filter((image) => image.id !== imageId));
        setIsError(false);
        setMessage("Photo removed.");
      } catch {
        setIsError(true);
        setMessage("This variant photo could not be removed.");
      }
    });
  }

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-[#76504a]">Photos</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={isUploading || isPending}
        onChange={(event) => selectFiles([...(event.target.files ?? [])])}
        className="mt-2 block w-full text-sm text-[#76504a]"
      />
      {previewUrls.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {previewUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt={`${label} selected preview`} className="h-16 w-16 rounded-xl object-cover" />
          ))}
        </div>
      ) : null}
      <button
        type="button"
        disabled={!files.length || isUploading || isPending}
        onClick={upload}
        className="mt-3 rounded-full bg-[#d38aa0] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading || isPending ? "Uploading..." : "Upload photos"}
      </button>
      {!message ? (
        <span className="ml-3 text-xs font-medium text-[#8f5574]">
          {isUploading || isPending ? "Uploading..." : "Choose photos to upload."}
        </span>
      ) : null}
      {message ? (
        <p className={`mt-2 text-xs font-semibold ${isError ? "text-[#a04462]" : "text-[#447451]"}`}>
          {message}
        </p>
      ) : null}
      {images.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((image) => (
            <div key={image.id} className="relative">
              <Image width={64} height={64} sizes="64px" src={image.imageUrl} alt={image.altText ?? label} className="h-16 w-16 rounded-xl object-cover" />
              <button type="button" disabled={isPending} onClick={() => remove(image.id)} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#7A3F63] text-xs text-white" aria-label={`Remove ${label} photo`}>×</button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
