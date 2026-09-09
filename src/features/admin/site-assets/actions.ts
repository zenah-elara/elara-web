"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/features/auth/queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const siteAssetsBucket = "site-assets";
const maxAssetImageBytes = 8 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const imageValidationMessage = "Upload a JPG, PNG, or WebP image under 8 MB.";
const storageSetupMessage =
  "Homepage image storage is not fully set up yet. Please apply the required Supabase migration and bucket policies.";
const imageRecordSaveMessage =
  "Homepage image uploaded, but it could not be saved to the homepage record. Please check site_assets permissions.";

export type HomepageHeroActionState = {
  success: boolean;
  message: string;
};

const initialFailureState: HomepageHeroActionState = {
  success: false,
  message: storageSetupMessage,
};

async function getAuthorizedSupabase() {
  await requireAdminUser();
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  return supabase;
}

function logHomepageError(message: string, error: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (error && typeof error === "object") {
    const maybeError = error as { code?: string; message?: string; name?: string };
    console.error(`[admin homepage] ${message}`, {
      code: maybeError.code ?? maybeError.name,
      message: maybeError.message,
    });
    return;
  }

  console.error(`[admin homepage] ${message}`);
}

function getImageFile(formData: FormData) {
  const file = formData.get("image");
  return file instanceof File && file.size > 0 ? file : null;
}

function validateImage(image: File) {
  if (
    image.size > maxAssetImageBytes ||
    !allowedImageTypes.includes(image.type)
  ) {
    throw new Error(imageValidationMessage);
  }
}

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

export async function updateHomepageHero(
  _previousState: HomepageHeroActionState,
  formData: FormData,
): Promise<HomepageHeroActionState> {
  const supabase = await getAuthorizedSupabase();

  if (!supabase) {
    return initialFailureState;
  }

  const title = String(formData.get("title") ?? "").trim() || null;
  const altText =
    String(formData.get("alt_text") ?? "").trim() ||
    "elara. jewelry homepage photo";
  const shouldClear = formData.get("clear_image") === "on";
  const image = getImageFile(formData);
  let imageUrl =
    String(formData.get("existing_image_url") ?? "").trim() || null;
  let didUploadImage = false;

  if (shouldClear) {
    imageUrl = null;
  }

  if (image) {
    try {
      validateImage(image);
    } catch (error) {
      logHomepageError("Hero image validation failed.", error);
      return {
        success: false,
        message: imageValidationMessage,
      };
    }

    const filePath = `site/homepage/${Date.now()}-${safeFileName(image.name)}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(siteAssetsBucket)
        .upload(filePath, image, {
          upsert: false,
          contentType: image.type || undefined,
        });

      if (uploadError) {
        logHomepageError("Hero image upload failed.", uploadError);
        return {
          success: false,
          message: storageSetupMessage,
        };
      }
    } catch (error) {
      logHomepageError("Hero image upload crashed.", error);
      return {
        success: false,
        message: storageSetupMessage,
      };
    }

    const { data } = supabase.storage
      .from(siteAssetsBucket)
      .getPublicUrl(filePath);

    imageUrl = data.publicUrl?.trim() || null;
    didUploadImage = Boolean(imageUrl);

    if (!imageUrl) {
      return {
        success: false,
        message: "Homepage image uploaded, but a public image URL could not be created.",
      };
    }
  }

  try {
    const { error } = await supabase.from("site_assets").upsert(
      {
        key: "homepage_hero",
        title: title ?? "Homepage hero",
        alt_text: altText,
        image_url: imageUrl,
        is_active: true,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "key" },
    );

    if (error) {
      logHomepageError("Hero image record save failed.", error);
      return {
        success: false,
        message: didUploadImage ? imageRecordSaveMessage : storageSetupMessage,
      };
    }
  } catch (error) {
    logHomepageError("Hero image record save crashed.", error);
    return {
      success: false,
      message: didUploadImage ? imageRecordSaveMessage : storageSetupMessage,
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/homepage");

  return {
    success: true,
    message: "Homepage hero image saved.",
  };
}
