"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/features/auth/queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const storageSetupMessage =
  "Homepage image storage is not fully set up yet. Please apply the required Supabase migration and bucket policies.";
const imageRecordSaveMessage =
  "Homepage image uploaded, but it could not be saved to the homepage record. Please check site_assets permissions.";
const defaultHomepageAltText = "elara. jewelry homepage photo";

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

export async function updateHomepageHero(
  formData: FormData,
): Promise<HomepageHeroActionState> {
  const supabase = await getAuthorizedSupabase();

  if (!supabase) {
    return initialFailureState;
  }

  const title = String(formData.get("title") ?? "").trim() || "Homepage hero";
  const altText =
    String(formData.get("alt_text") ?? "").trim() || defaultHomepageAltText;
  const shouldClear = formData.get("clear_image") === "on";
  let imageUrl =
    String(formData.get("image_url") ?? "").trim() ||
    String(formData.get("existing_image_url") ?? "").trim() ||
    null;

  if (shouldClear) {
    imageUrl = null;
  }

  try {
    const { error } = await supabase.from("site_assets").upsert(
      {
        key: "homepage_hero",
        title,
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
        message: imageUrl ? imageRecordSaveMessage : storageSetupMessage,
      };
    }
  } catch (error) {
    logHomepageError("Hero image record save crashed.", error);
    return {
      success: false,
      message: imageUrl ? imageRecordSaveMessage : storageSetupMessage,
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/homepage");

  return {
    success: true,
    message: "Homepage hero image saved.",
  };
}
