"use client";

import { useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { updateHomepageHero } from "@/features/admin/site-assets/actions";
import type { HomepageHeroActionState } from "@/features/admin/site-assets/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { HomepageImageSubmitButton } from "./homepage-image-submit-button";

type HomepageImageFormProps = {
  existingImageUrl?: string | null;
  title?: string | null;
  altText?: string | null;
  initialMessage?: string | null;
};

const siteAssetsBucket = "site-assets";
const maxHomepageImageBytes = 4 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const sizeErrorMessage = "Please upload a smaller image under 4 MB.";
const imageTypeErrorMessage = "Upload a JPG, PNG, or WebP image.";
const storageSetupMessage =
  "Homepage image storage is not fully set up yet. Please apply the required Supabase migration and bucket policies.";
const imageRecordSaveMessage =
  "Homepage image uploaded, but it could not be saved to the homepage record. Please check site_assets permissions.";

function safeFileName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() || "jpg";
  const base =
    name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "homepage-hero";

  return `${base}.${extension}`;
}

function getImageFile(formData: FormData) {
  const file = formData.get("image");
  return file instanceof File && file.size > 0 ? file : null;
}

function validateImage(file: File) {
  if (file.size > maxHomepageImageBytes) {
    return sizeErrorMessage;
  }

  if (!allowedImageTypes.includes(file.type)) {
    return imageTypeErrorMessage;
  }

  return "";
}

export function HomepageImageForm({
  existingImageUrl,
  title,
  altText,
  initialMessage,
}: HomepageImageFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(
    existingImageUrl?.trim() || "",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<HomepageHeroActionState>({
    success: false,
    message: initialMessage ?? "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ success: false, message: "" });

    const formData = new FormData(event.currentTarget);
    const image = getImageFile(formData);
    const shouldClear = formData.get("clear_image") === "on";
    let imageUrl = currentImageUrl;

    if (shouldClear) {
      imageUrl = "";
    }

    if (image) {
      const validationMessage = validateImage(image);

      if (validationMessage) {
        setState({ success: false, message: validationMessage });
        return;
      }

      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setState({ success: false, message: storageSetupMessage });
        return;
      }

      const filePath = `site/homepage/${Date.now()}-${safeFileName(image.name)}`;
      setIsUploading(true);
      const { error: uploadError } = await supabase.storage
        .from(siteAssetsBucket)
        .upload(filePath, image, {
          upsert: false,
          contentType: image.type || undefined,
        })
        .catch((error: unknown) => {
          if (process.env.NODE_ENV === "development") {
            const maybeError = error as { message?: string };
            console.error("[admin homepage] Client hero image upload crashed.", {
              message: maybeError.message,
            });
          }

          return { error: new Error(storageSetupMessage) };
        })
        .finally(() => {
          setIsUploading(false);
        });

      if (uploadError) {
        if (process.env.NODE_ENV === "development") {
          console.error("[admin homepage] Client hero image upload failed.", {
            message: uploadError.message,
          });
        }

        setState({ success: false, message: storageSetupMessage });
        return;
      }

      const { data } = supabase.storage
        .from(siteAssetsBucket)
        .getPublicUrl(filePath);

      imageUrl = data.publicUrl?.trim() || "";

      if (!imageUrl) {
        setState({
          success: false,
          message:
            "Homepage image uploaded, but a public image URL could not be created.",
        });
        return;
      }
    }

    const saveData = new FormData();
    saveData.set("title", String(formData.get("title") ?? ""));
    saveData.set("alt_text", String(formData.get("alt_text") ?? ""));
    saveData.set("existing_image_url", currentImageUrl);
    saveData.set("image_url", imageUrl);

    if (shouldClear) {
      saveData.set("clear_image", "on");
    }

    startTransition(async () => {
      const result = await updateHomepageHero(saveData).catch((error: unknown) => {
        if (process.env.NODE_ENV === "development") {
          const maybeError = error as { message?: string };
          console.error("[admin homepage] Homepage record save crashed.", {
            message: maybeError.message,
          });
        }

        return {
          success: false,
          message: imageUrl ? imageRecordSaveMessage : storageSetupMessage,
        };
      });

      setState(result);

      if (result.success) {
        setCurrentImageUrl(imageUrl);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else if (image) {
        setState({
          success: false,
          message: imageRecordSaveMessage,
        });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl boutique-card p-6"
    >
      {state.message ? (
        <div
          className={`rounded-2xl border p-4 text-sm font-medium ${
            state.success
              ? "border-[#D5A84F]/70 bg-[#fff8e8] text-[#7A3F63]"
              : "border-[#efd2bc] bg-[#fff7ef] text-[#76504a]"
          }`}
        >
          {state.message}
        </div>
      ) : null}
      <input
        type="hidden"
        name="existing_image_url"
        value={currentImageUrl}
        readOnly
      />
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Title / label</span>
        <input
          name="title"
          defaultValue={title ?? "Homepage hero"}
          className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Hero image</span>
        <input
          ref={fileInputRef}
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-2 w-full text-sm text-[#76504a]"
        />
        <span className="mt-2 block text-xs font-medium text-[#8f4f68]">
          Upload a JPG, PNG, or WebP image under 8 MB.
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Alt text</span>
        <input
          name="alt_text"
          defaultValue={altText ?? ""}
          className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none"
        />
      </label>
      <label className="flex items-center gap-3 text-sm font-semibold text-cocoa">
        <input name="clear_image" type="checkbox" className="h-4 w-4" />
        Clear current image
      </label>
      <HomepageImageSubmitButton pending={isUploading || isPending} />
    </form>
  );
}
