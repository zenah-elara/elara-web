"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/features/auth/queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import {
  parseCollectionFormData,
  parseProductFormData,
  parseTags,
} from "./schemas";

type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
type VariantFormValue = {
  clientKey: string;
  id?: string;
  finish: string | null;
  color: string | null;
  stockQuantity: number;
  priceOverride: number | null;
  materialTypeOverride: "gold_plated" | "stainless_steel" | null;
  isActive: boolean;
  sortOrder: number;
};

const productImagesBucket = "product-images";
const collectionImagesBucket = "collection-images";
const maxProductImageBytes = 8 * 1024 * 1024;
const allowedProductImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const imageValidationMessage = "Upload a JPG, PNG, or WebP image under 8 MB.";
const imageStorageSetupMessage =
  "Image upload failed. Please check the product-images storage bucket setup.";
const readyCollectionProductTypes = [
  "regular_product",
  "necklace",
  "bracelet",
  "ring",
] as const;

function redirectWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

function safeImageErrorMessage(error: unknown) {
  return error instanceof Error && error.message === imageValidationMessage
    ? imageValidationMessage
    : imageStorageSetupMessage;
}

function logProductUpdateError({
  productId,
  step,
  error,
  payloadKeys,
}: {
  productId: string;
  step: string;
  error: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  } | null;
  payloadKeys?: string[];
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.warn("[admin catalog] product update failed", {
    step,
    productId,
    payloadKeys,
    error: error
      ? {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        }
      : null,
  });
}

function getProductImageFiles(formData: FormData) {
  return [...formData.getAll("images"), ...formData.getAll("image")].filter(
    (value): value is File => value instanceof File && value.size > 0,
  );
}

function getSingleImageFile(formData: FormData, key: string) {
  const image = formData.get(key);
  return image instanceof File && image.size > 0 ? image : null;
}

function parseVariantFormValues(formData: FormData): VariantFormValue[] {
  try {
    const parsed = JSON.parse(String(formData.get("variants_json") ?? "[]"));
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((value): value is VariantFormValue =>
      Boolean(
        value &&
        typeof value.clientKey === "string" &&
        (typeof value.finish === "string" || value.finish === null) &&
        (typeof value.color === "string" || value.color === null) &&
        (value.finish?.trim() || value.color?.trim()) &&
        Number.isFinite(Number(value.stockQuantity)),
      ),
    );
  } catch {
    return [];
  }
}

async function syncProductVariants(productId: string, formData: FormData) {
  const supabase = await getAuthorizedSupabase();
  const enabled = formData.get("has_variants") === "on";
  const values = enabled ? parseVariantFormValues(formData) : [];
  const retainedIds: string[] = [];

  if (enabled && values.length === 0) {
    throw new Error("Add at least one Finish or Color option before enabling variants.");
  }

  for (const [index, value] of values.entries()) {
    const payload = {
      product_id: productId,
      finish: value.finish?.trim() || null,
      color: value.color?.trim() || null,
      stock_quantity: Math.max(0, Math.floor(Number(value.stockQuantity))),
      price_override:
        value.priceOverride === null || value.priceOverride === undefined
          ? null
          : Math.max(0, Number(value.priceOverride)),
      material_type_override: value.materialTypeOverride || null,
      is_active: Boolean(value.isActive),
      sort_order: Number.isFinite(value.sortOrder) ? value.sortOrder : index,
    };
    let variantId: string;

    if (value.id) {
      const { data, error } = await supabase
          .from("product_variants")
          .update(payload as never)
          .eq("id", value.id)
          .eq("product_id", productId)
          .select("id")
          .single();
      if (error || !data) throw new Error("Variant combinations could not be saved.");
      variantId = (data as { id: string }).id;
    } else {
      const { data, error } = await supabase
          .from("product_variants")
          .insert(payload as never)
          .select("id")
          .single();
      if (error || !data) throw new Error("Variant combinations could not be saved.");
      variantId = (data as { id: string }).id;
    }
    retainedIds.push(variantId);
    const files = formData
      .getAll(`variant_images_${value.clientKey}`)
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    for (const [imageIndex, image] of files.entries()) {
      validateProductImage(image);
      const filePath = `products/${productId}/variants/${variantId}/${Date.now()}-${imageIndex}-${safeImageFileName(image.name, "variant-image")}`;
      const { error: uploadError } = await supabase.storage
        .from(productImagesBucket)
        .upload(filePath, image, { upsert: false, contentType: image.type || undefined });

      if (uploadError) throw new Error(imageStorageSetupMessage);
      const { data: publicUrl } = supabase.storage.from(productImagesBucket).getPublicUrl(filePath);
      const { error: imageError } = await supabase.from("product_images").insert({
        product_id: productId,
        variant_id: variantId,
        image_url: publicUrl.publicUrl,
        alt_text: `${payload.finish ?? ""} ${payload.color ?? ""}`.trim() || null,
        sort_order: imageIndex,
        is_primary: imageIndex === 0,
      } as never);
      if (imageError) throw new Error("Variant image could not be saved.");
    }
  }

  const { data: existing } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);
  const omittedIds = ((existing ?? []) as { id: string }[])
    .map((variant) => variant.id)
    .filter((id) => !retainedIds.includes(id));

  if (omittedIds.length) {
    await supabase.from("product_variants").update({ is_active: false } as never).in("id", omittedIds);
  }

  const removeImageIds = formData.getAll("remove_variant_image_ids").map(String).filter(Boolean);
  if (removeImageIds.length) {
    await supabase.from("product_images").delete().eq("product_id", productId).in("id", removeImageIds);
  }
}

function validateProductImage(image: File) {
  if (image.size > maxProductImageBytes || !allowedProductImageTypes.has(image.type)) {
    throw new Error(imageValidationMessage);
  }
}

function safeImageFileName(name: string, fallback: string) {
  const extension = name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName =
    name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback;

  return `${safeName}.${extension}`;
}

async function getAuthorizedSupabase() {
  await requireAdminUser();
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function revalidateStorefrontCatalog(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/collections");
  revalidatePath("/shop-products");
  revalidatePath("/products");

  if (slug) {
    revalidatePath(`/products/${slug}`);
  }
}

export async function createCollection(formData: FormData) {
  const supabase = await getAuthorizedSupabase();
  const payload = parseCollectionFormData(formData);
  const collectionPayload = {
    ...payload,
    published_at: payload.is_published ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase
    .from("collections")
    .insert(collectionPayload as never)
    .select("id, slug")
    .single();

  if (error || !data) {
    redirectWithMessage("/admin/collections/new", "Collection could not be created.");
  }

  const collection = data as unknown as { id: string; slug: string };

  try {
    await uploadCollectionImage(collection.id, formData, false);
  } catch (error) {
    redirectWithMessage(
      "/admin/collections",
      safeImageErrorMessage(error),
    );
  }

  revalidatePath("/admin/collections");
  revalidateStorefrontCatalog();
  redirectWithMessage("/admin/collections", "Collection saved.");
}

export async function updateCollection(
  collectionId: string,
  formData: FormData,
) {
  const supabase = await getAuthorizedSupabase();
  const { data: previousCollection } = await supabase
    .from("collections")
    .select("slug, is_published, published_at")
    .eq("id", collectionId)
    .maybeSingle();
  const payload = parseCollectionFormData(formData);
  const updatePayload: Record<string, unknown> = { ...payload };
  const previous = previousCollection as {
    slug?: string;
    is_published?: boolean;
    published_at?: string | null;
  } | null;

  updatePayload.published_at = payload.is_published
    ? previous?.is_published
      ? previous.published_at
      : new Date().toISOString()
    : previous?.published_at ?? null;

  if (formData.get("clear_collection_image") === "on") {
    updatePayload.image_url = null;
  }

  const { error } = await supabase
    .from("collections")
    .update(updatePayload as never)
    .eq("id", collectionId);

  if (error) {
    redirectWithMessage(
      `/admin/collections/${collectionId}/edit`,
      "Collection could not be updated.",
    );
  }

  try {
    await uploadCollectionImage(collectionId, formData, false);
  } catch (error) {
    redirectWithMessage(
      `/admin/collections/${collectionId}/edit`,
      safeImageErrorMessage(error),
    );
  }

  revalidatePath("/admin/collections");
  revalidatePath(`/admin/collections/${collectionId}/edit`);
  revalidateStorefrontCatalog(
    previous?.slug ?? payload.slug,
  );
  revalidateStorefrontCatalog();
  redirectWithMessage(
    `/admin/collections/${collectionId}/edit`,
    "Collection updated.",
  );
}

export async function uploadCollectionImage(
  collectionId: string,
  formData: FormData,
  shouldRedirect = true,
) {
  const image = getSingleImageFile(formData, "collection_image");

  if (!image) {
    return;
  }

  try {
    validateProductImage(image);
  } catch {
    if (shouldRedirect) {
      redirectWithMessage(
        `/admin/collections/${collectionId}/edit`,
        imageValidationMessage,
      );
    }

    throw new Error(imageValidationMessage);
  }

  const supabase = await getAuthorizedSupabase();
  const filePath = `collections/${collectionId}/${Date.now()}-${safeImageFileName(
    image.name,
    "collection-image",
  )}`;
  const { error: uploadError } = await supabase.storage
    .from(collectionImagesBucket)
    .upload(filePath, image, {
      upsert: false,
      contentType: image.type || undefined,
    });

  if (uploadError) {
    if (shouldRedirect) {
      redirectWithMessage(
        `/admin/collections/${collectionId}/edit`,
        "Collection image upload failed. Please check the collection-images storage bucket setup.",
      );
    }

    throw new Error(imageStorageSetupMessage);
  }

  const { data } = supabase.storage
    .from(collectionImagesBucket)
    .getPublicUrl(filePath);
  const altText =
    String(formData.get("image_alt_text") ?? "").trim() ||
    String(formData.get("name") ?? "").trim() ||
    null;
  const { error } = await supabase
    .from("collections")
    .update({
      image_url: data.publicUrl,
      image_alt_text: altText,
    } as never)
    .eq("id", collectionId);

  if (error) {
    if (shouldRedirect) {
      redirectWithMessage(
        `/admin/collections/${collectionId}/edit`,
        "Collection image could not be saved.",
      );
    }

    throw new Error("Collection image could not be saved.");
  }

  if (shouldRedirect) {
    revalidatePath("/collections");
    revalidatePath(`/admin/collections/${collectionId}/edit`);
    redirectWithMessage(
      `/admin/collections/${collectionId}/edit`,
      "Collection image uploaded.",
    );
  }
}

export async function setCollectionPublished(
  collectionId: string,
  isPublished: boolean,
) {
  const supabase = await getAuthorizedSupabase();
  const { error } = await supabase
    .from("collections")
    .update({
      is_published: isPublished,
      ...(isPublished ? { published_at: new Date().toISOString() } : {}),
    } as never)
    .eq("id", collectionId);

  if (error) {
    redirectWithMessage(
      "/admin/collections",
      "Collection publishing status could not change.",
    );
  }

  revalidatePath("/admin/collections");
  revalidateStorefrontCatalog();
  redirectWithMessage(
    "/admin/collections",
    isPublished ? "Collection published." : "Collection moved to Draft.",
  );
}

export async function publishAllReadyCollections() {
  const supabase = await getAuthorizedSupabase();
  const { data: draftCollections, error: collectionsError } = await supabase
    .from("collections")
    .select("id, name, slug")
    .eq("is_published", false);

  if (collectionsError || !draftCollections) {
    redirectWithMessage(
      "/admin/collections",
      "Ready collections could not be checked.",
    );
  }

  const drafts = draftCollections as unknown as {
    id: string;
    name: string;
    slug: string;
  }[];
  const draftIds = drafts.map((collection) => collection.id);

  if (draftIds.length === 0) {
    redirectWithMessage("/admin/collections", "No Draft collections to publish.");
  }

  const { data: activeProducts, error: productsError } = await supabase
    .from("products")
    .select("collection_id")
    .eq("is_active", true)
    .in("product_type", [...readyCollectionProductTypes])
    .in("collection_id", draftIds);

  if (productsError || !activeProducts) {
    redirectWithMessage(
      "/admin/collections",
      "Collection readiness could not be checked.",
    );
  }

  const products = activeProducts as unknown as { collection_id: string | null }[];
  const collectionIdsWithProducts = new Set(
    products
      .map((product) => product.collection_id)
      .filter((id): id is string => Boolean(id)),
  );
  const readyIds = drafts
    .filter(
      (collection) =>
        collection.name.trim() &&
        collection.slug.trim() &&
        collectionIdsWithProducts.has(collection.id),
    )
    .map((collection) => collection.id);
  const skippedCount = drafts.length - readyIds.length;

  if (readyIds.length > 0) {
    const { error } = await supabase
      .from("collections")
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
      } as never)
      .in("id", readyIds);

    if (error) {
      redirectWithMessage(
        "/admin/collections",
        "Ready collections could not be published.",
      );
    }
  }

  revalidatePath("/admin/collections");
  revalidateStorefrontCatalog();

  const publishedLabel = `${readyIds.length} ${readyIds.length === 1 ? "collection" : "collections"} published.`;
  const skippedLabel = skippedCount
    ? ` ${skippedCount} ${skippedCount === 1 ? "collection was" : "collections were"} skipped because ${skippedCount === 1 ? "it has" : "they have"} no active ready-to-shop products.`
    : "";

  redirectWithMessage("/admin/collections", `${publishedLabel}${skippedLabel}`);
}

export async function deleteCollection(collectionId: string, formData: FormData) {
  const supabase = await getAuthorizedSupabase();
  const confirmed = formData.get("confirm_delete_collection") === "on";

  if (!confirmed) {
    redirectWithMessage(
      `/admin/collections/${collectionId}/edit`,
      "Confirm collection deletion before continuing.",
    );
  }

  const { data: collection } = await supabase
    .from("collections")
    .select("slug")
    .eq("id", collectionId)
    .maybeSingle();
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId);

  if (error) {
    redirectWithMessage(
      `/admin/collections/${collectionId}/edit`,
      "Collection could not be deleted.",
    );
  }

  revalidatePath("/admin/collections");
  revalidateStorefrontCatalog((collection as { slug?: string } | null)?.slug);
  revalidateStorefrontCatalog();
  redirect("/admin/collections?deleted=1");
}

export async function createProduct(formData: FormData) {
  const supabase = await getAuthorizedSupabase();
  const payload = parseProductFormData(formData);
  const { data, error } = await supabase
    .from("products")
    .insert(payload as never)
    .select("id, slug")
    .single();

  if (error || !data) {
    redirectWithMessage("/admin/products/new", "Product could not be created.");
  }

  const createdProduct = data as unknown as { id: string; slug: string };
  const productId = createdProduct.id;

  await upsertProductTags(productId, parseTags(formData.get("tags")));

  try {
    await syncProductVariants(productId, formData);
  } catch (error) {
    redirectWithMessage(
      "/admin/products",
      error instanceof Error ? error.message : "Product variants could not be saved.",
    );
  }

  try {
    await uploadProductImages(productId, formData, false);
  } catch (error) {
    redirectWithMessage(
      "/admin/products",
      safeImageErrorMessage(error),
    );
  }

  revalidatePath("/admin/products");
  revalidateStorefrontCatalog(createdProduct.slug);
  redirectWithMessage("/admin/products", "Product saved.");
}

export async function updateProduct(productId: string, formData: FormData) {
  const supabase = await getAuthorizedSupabase();
  const { data: previousProduct } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  let payload: ReturnType<typeof parseProductFormData>;

  try {
    payload = parseProductFormData(formData);
  } catch (error) {
    logProductUpdateError({
      productId,
      step: "parseProductFormData",
      error:
        error instanceof Error
          ? {
              message: error.message,
            }
          : null,
    });
    redirectWithMessage(
      `/admin/products/${productId}/edit`,
      "Product could not be updated. Please check required fields and product setup.",
    );
  }

  const payloadKeys = Object.keys(payload).sort();
  const { error } = await supabase
    .from("products")
    .update(payload as never)
    .eq("id", productId);

  if (error) {
    logProductUpdateError({
      productId,
      step: "products.update",
      error,
      payloadKeys,
    });
    redirectWithMessage(
      `/admin/products/${productId}/edit`,
      "Product could not be updated. Please check required fields and product setup.",
    );
  }

  await upsertProductTags(productId, parseTags(formData.get("tags")));

  try {
    await syncProductVariants(productId, formData);
  } catch (error) {
    redirectWithMessage(
      `/admin/products/${productId}/edit`,
      error instanceof Error ? error.message : "Product variants could not be saved.",
    );
  }

  try {
    await uploadProductImages(productId, formData, false);
  } catch (error) {
    redirectWithMessage(
      `/admin/products/${productId}/edit`,
      safeImageErrorMessage(error),
    );
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidateStorefrontCatalog(
    (previousProduct as { slug?: string } | null)?.slug ?? payload.slug,
  );
  revalidateStorefrontCatalog(payload.slug);
  redirectWithMessage(`/admin/products/${productId}/edit`, "Product updated.");
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  const supabase = await getAuthorizedSupabase();
  const { data: product } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive } as never)
    .eq("id", productId);

  if (error) {
    redirectWithMessage("/admin/products", "Product status could not change.");
  }

  revalidatePath("/admin/products");
  revalidateStorefrontCatalog((product as { slug?: string } | null)?.slug);
  redirectWithMessage(
    "/admin/products",
    isActive ? "Product activated." : "Product deactivated.",
  );
}

export async function deleteProduct(productId: string) {
  const supabase = await getAuthorizedSupabase();
  const { data: product } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    redirectWithMessage(
      `/admin/products/${productId}/edit`,
      "This product cannot be deleted because it is already attached to an order. You can deactivate it instead.",
    );
  }

  revalidatePath("/admin/products");
  revalidateStorefrontCatalog((product as { slug?: string } | null)?.slug);
  redirectWithMessage("/admin/products", "Product deleted.");
}

export async function upsertProductTags(productId: string, tags: string[]) {
  const supabase = await getAuthorizedSupabase();
  await supabase.from("product_tags").delete().eq("product_id", productId);

  if (tags.length === 0) {
    return;
  }

  await supabase.from("product_tags").insert(
    tags.map((tag) => ({
      product_id: productId,
      tag,
    })) as never[],
  );
}

export async function uploadProductImages(
  productId: string,
  formData: FormData,
  shouldRedirect = true,
) {
  const images = getProductImageFiles(formData);

  if (images.length === 0) {
    return;
  }

  try {
    images.forEach(validateProductImage);
  } catch {
    if (shouldRedirect) {
      redirectWithMessage(
        `/admin/products/${productId}/edit`,
        imageValidationMessage,
      );
    }

    throw new Error(imageValidationMessage);
  }

  const supabase = await getAuthorizedSupabase();
  const [{ data: existingPrimary }, { data: latestSortedImage }] =
    await Promise.all([
      supabase
        .from("product_images")
        .select("id")
        .eq("product_id", productId)
        .eq("is_primary", true)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("product_images")
        .select("sort_order")
        .eq("product_id", productId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
  const hasExistingPrimary = Boolean(existingPrimary);
  const currentMaxSortOrder =
    (latestSortedImage as Pick<ProductImageRow, "sort_order"> | null)
      ?.sort_order ?? -1;
  const shouldMakeFirstPrimary =
    formData.get("image_is_primary") === "on" || !hasExistingPrimary;

  if (shouldMakeFirstPrimary) {
    await supabase
      .from("product_images")
      .update({ is_primary: false } as never)
      .eq("product_id", productId);
  }

  const altText = String(formData.get("image_alt_text") ?? "").trim() || null;
  const imageRows = [];

  for (const [index, image] of images.entries()) {
    const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName =
      image.name
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "product-image";
    const filePath = `products/${productId}/${Date.now()}-${index}-${safeName}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(productImagesBucket)
      .upload(filePath, image, {
        upsert: false,
        contentType: image.type || undefined,
      });

    if (uploadError) {
      if (shouldRedirect) {
        redirectWithMessage(
          `/admin/products/${productId}/edit`,
          imageStorageSetupMessage,
        );
      }

      throw new Error(imageStorageSetupMessage);
    }

    const { data } = supabase.storage
      .from(productImagesBucket)
      .getPublicUrl(filePath);

    imageRows.push({
      product_id: productId,
      image_url: data.publicUrl,
      alt_text: altText,
      is_primary: shouldMakeFirstPrimary && index === 0,
      sort_order: currentMaxSortOrder + index + 1,
    });
  }

  const { error: imageError } = await supabase
    .from("product_images")
    .insert(imageRows as never[]);

  if (imageError) {
    if (shouldRedirect) {
      redirectWithMessage(
        `/admin/products/${productId}/edit`,
        "Image uploaded, but the image record could not be saved.",
      );
    }

    throw new Error("Image record could not be saved.");
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidateStorefrontCatalog();

  if (shouldRedirect) {
    redirectWithMessage(
      `/admin/products/${productId}/edit`,
      images.length === 1 ? "Image uploaded." : "Images uploaded.",
    );
  }
}

export async function uploadProductImageAction(
  productId: string,
  formData: FormData,
) {
  await uploadProductImages(productId, formData, true);
}

export async function setPrimaryProductImage(productId: string, imageId: string) {
  const supabase = await getAuthorizedSupabase();
  await supabase
    .from("product_images")
    .update({ is_primary: false } as never)
    .eq("product_id", productId);

  const { error } = await supabase
    .from("product_images")
    .update({ is_primary: true } as never)
    .eq("id", imageId)
    .eq("product_id", productId);

  if (error) {
    redirectWithMessage(
      `/admin/products/${productId}/edit`,
      "Primary image could not be updated.",
    );
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidateStorefrontCatalog();
  redirectWithMessage(`/admin/products/${productId}/edit`, "Primary image updated.");
}

export async function deleteProductImage(productId: string, imageId: string) {
  const supabase = await getAuthorizedSupabase();
  const { data: imageToDelete } = await supabase
    .from("product_images")
    .select("is_primary")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId);

  if (error) {
    redirectWithMessage(
      `/admin/products/${productId}/edit`,
      "Image could not be deleted.",
    );
  }

  if ((imageToDelete as Pick<ProductImageRow, "is_primary"> | null)?.is_primary) {
    const { data: nextImage } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    const nextImageId = (nextImage as Pick<ProductImageRow, "id"> | null)?.id;

    if (nextImageId) {
      await supabase
        .from("product_images")
        .update({ is_primary: true } as never)
        .eq("id", nextImageId)
        .eq("product_id", productId);
    }
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  revalidateStorefrontCatalog();
  redirectWithMessage(`/admin/products/${productId}/edit`, "Image deleted.");
}
