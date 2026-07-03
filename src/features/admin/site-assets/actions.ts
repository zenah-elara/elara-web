"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/features/auth/queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const siteAssetsBucket = "site-assets";
const maxAssetImageBytes = 8 * 1024 * 1024;
const imageValidationMessage = "Upload a JPG, PNG, or WebP image under 8 MB.";

function redirectWithMessage(path: string, message: string) {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

async function getAuthorizedSupabase() {
  await requireAdminUser();
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function getImageFile(formData: FormData) {
  const file = formData.get("image");
  return file instanceof File && file.size > 0 ? file : null;
}

function validateImage(image: File) {
  if (image.size > maxAssetImageBytes || !image.type.startsWith("image/")) {
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

export async function updateHomepageHero(formData: FormData) {
  const supabase = await getAuthorizedSupabase();
  const title = String(formData.get("title") ?? "").trim() || null;
  const altText = String(formData.get("alt_text") ?? "").trim() || null;
  const shouldClear = formData.get("clear_image") === "on";
  const image = getImageFile(formData);
  let imageUrl =
    String(formData.get("existing_image_url") ?? "").trim() || null;

  if (shouldClear) {
    imageUrl = null;
  }

  if (image) {
    try {
      validateImage(image);
    } catch {
      redirectWithMessage("/admin/homepage", imageValidationMessage);
    }

    const filePath = `site/homepage/${Date.now()}-${safeFileName(image.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(siteAssetsBucket)
      .upload(filePath, image, {
        upsert: false,
        contentType: image.type || undefined,
      });

    if (uploadError) {
      redirectWithMessage(
        "/admin/homepage",
        "Homepage image upload failed. Please check the site-assets storage bucket setup.",
      );
    }

    const { data } = supabase.storage
      .from(siteAssetsBucket)
      .getPublicUrl(filePath);

    imageUrl = data.publicUrl;
  }

  const { error } = await supabase.from("site_assets").upsert(
    {
      key: "homepage_hero",
      title,
      alt_text: altText,
      image_url: imageUrl,
      is_active: true,
    } as never,
    { onConflict: "key" },
  );

  if (error) {
    redirectWithMessage("/admin/homepage", "Homepage image could not be saved.");
  }

  revalidatePath("/");
  revalidatePath("/admin/homepage");
  redirectWithMessage("/admin/homepage", "Homepage hero image saved.");
}
