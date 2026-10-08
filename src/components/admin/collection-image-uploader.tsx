"use client";
import Image from "next/image";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  attachCollectionImage,
  removeCollectionImage,
} from "@/features/admin/catalog/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const maxBytes = 8 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

type CollectionImageUploaderProps = {
  collectionId?: string;
  collectionName: string;
  initialImageUrl?: string | null;
  initialAltText?: string | null;
};

function safeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "") || "collection-image.jpg";
}

export function CollectionImageUploader({
  collectionId,
  collectionName,
  initialImageUrl = null,
  initialAltText = null,
}: CollectionImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [altText, setAltText] = useState(
    initialAltText ?? `${collectionName} collection thumbnail`,
  );
  const [message, setMessage] = useState("Choose an image to upload.");
  const [isError, setIsError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!collectionId) {
    return (
      <p className="mt-4 text-sm text-[#76504a]">
        Save the collection first before uploading a thumbnail.
      </p>
    );
  }

  const savedCollectionId = collectionId;

  function selectFile(nextFile: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);

    if (!nextFile) {
      setIsError(false);
      setMessage("Choose an image to upload.");
      return;
    }

    if (nextFile.size > maxBytes) {
      setIsError(true);
      setMessage("This image is too large. Please upload a smaller image.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (!allowedTypes.includes(nextFile.type)) {
      setIsError(true);
      setMessage("This file type is not supported. Please use JPG, PNG, or WebP.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setIsError(false);
    setMessage("Ready to upload.");
  }

  async function upload() {
    if (!file || uploading || pending) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsError(true);
      setMessage("The image could not be uploaded. Please try again.");
      return;
    }

    setUploading(true);
    setIsError(false);
    setMessage("Uploading...");
    const storagePath = `collections/${savedCollectionId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from("collection-images")
      .upload(storagePath, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[admin collections] thumbnail upload failed", uploadError);
      }
      setUploading(false);
      setIsError(true);
      setMessage("The image could not be uploaded. Please try again.");
      return;
    }

    const publicUrl = supabase.storage
      .from("collection-images")
      .getPublicUrl(storagePath).data.publicUrl;
    setUploading(false);
    setMessage("Saving thumbnail...");

    startTransition(async () => {
      const data = new FormData();
      data.set("image_url", publicUrl);
      data.set("alt_text", altText.trim() || `${collectionName} collection thumbnail`);
      const result = await attachCollectionImage(savedCollectionId, data);

      if (!result.success) {
        await supabase.storage.from("collection-images").remove([storagePath]);
        setIsError(true);
        setMessage(result.message);
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setImageUrl(result.imageUrl ?? publicUrl);
      setPreviewUrl(null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setIsError(false);
      setMessage("Thumbnail saved.");
    });
  }

  function remove() {
    if (!imageUrl || pending || uploading) return;
    if (!window.confirm("Remove this collection thumbnail?")) return;

    setIsError(false);
    setMessage("Saving thumbnail...");
    startTransition(async () => {
      const result = await removeCollectionImage(savedCollectionId);
      if (!result.success) {
        setIsError(true);
        setMessage(result.message);
        return;
      }

      setImageUrl(null);
      setIsError(false);
      setMessage("Thumbnail removed.");
    });
  }

  const displayUrl = previewUrl ?? imageUrl;

  return (
    <div className="mt-5">
      <div className="overflow-hidden rounded-2xl border border-[#efccd4] bg-[#fff1f6]">
        {imageUrl ? (
          <p className="bg-white/80 px-4 py-2 text-xs font-semibold text-[#7A3F63]">
            Current thumbnail
          </p>
        ) : null}
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={altText || collectionName}
            className="h-56 w-full object-cover"
          />
        ) : displayUrl ? (
          <Image width={640} height={224} sizes="(max-width: 767px) 100vw, 640px" src={displayUrl} alt={altText || collectionName} className="h-56 w-full object-cover" />
        ) : (
          <div className="flex h-40 items-center justify-center px-6 text-center text-sm font-semibold text-[#9A4F78]">
            No collection thumbnail uploaded yet.
          </div>
        )}
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-cocoa">
          {imageUrl ? "Replace thumbnail" : "Choose thumbnail"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading || pending}
          onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm text-[#76504a]"
        />
        <span className="mt-2 block text-xs font-medium text-[#8f4f68]">
          Upload a JPG, PNG, or WebP image under 8 MB.
        </span>
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-semibold text-cocoa">Image alt text</span>
        <input
          value={altText}
          onChange={(event) => setAltText(event.target.value)}
          disabled={uploading || pending}
          className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-cocoa outline-none"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={upload}
          disabled={!file || uploading || pending}
          className="rounded-full bg-[#d38aa0] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {uploading || pending ? "Uploading..." : "Upload image"}
        </button>
        {imageUrl ? (
          <button
            type="button"
            onClick={remove}
            disabled={uploading || pending}
            className="rounded-full border border-[#d8b36a] bg-[#fffdf8] px-4 py-2 text-sm font-semibold text-[#7A3F63] disabled:opacity-50"
          >
            Remove thumbnail
          </button>
        ) : null}
      </div>

      <p className={`mt-3 text-xs font-semibold ${isError ? "text-[#a04462]" : "text-[#447451]"}`}>
        {message}
      </p>
    </div>
  );
}
