import { collections as mockCollections } from "@/lib/data";
import { getSupabasePublicServerClient } from "@/lib/supabase/server";
import {
  getMaterialCareInstruction,
  getMaterialNote,
  normalizeMaterialType,
} from "@/lib/materials";
import type {
  CatalogCollection,
  CatalogProduct,
  ProductWithRelations,
} from "./types";

const collectionAccents = new Map(
  mockCollections.map((collection) => [collection.slug, collection.accent]),
);

const readyToShopProductTypes: NonNullable<CatalogProduct["productType"]>[] = [
  "regular_product",
  "necklace",
  "bracelet",
  "ring",
];

const bestSellerStatuses = ["confirmed", "paid", "packed", "delivered"];

function warnFallback(queryName: string) {
  console.warn(`[catalog] ${queryName} failed; returning empty catalog.`);
}

function warnConfiguredQuery(queryName: string) {
  console.warn(`[catalog] ${queryName} failed; returning empty live catalog.`);
}

function mapCollection(collection: {
  name: string;
  slug: string;
  description: string | null;
  image_url?: string | null;
  image_alt_text?: string | null;
}): CatalogCollection {
  return {
    name: collection.name,
    slug: collection.slug,
    description: collection.description ?? "",
    accent:
      collectionAccents.get(collection.slug) ??
      "from-[#fff4ef] to-[#f8dce3]",
    imageUrl: collection.image_url ?? undefined,
    imageAlt: collection.image_alt_text ?? collection.name,
  };
}

function mapProduct(product: ProductWithRelations): CatalogProduct {
  const finishType = normalizeMaterialType(product.finish_type);
  const sizeLengthBehavior =
    product.size_length_behavior && product.size_length_behavior !== "none"
      ? product.size_length_behavior
      : product.is_size_customizable && product.size_options?.length
        ? "preset"
        : "none";
  const sortedImages = [...(product.product_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const primaryImage =
    sortedImages.find((image) => image.is_primary) ?? sortedImages[0];
  const galleryImages = primaryImage
    ? [
        primaryImage,
        ...sortedImages.filter((image) => image !== primaryImage),
      ]
    : sortedImages;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    price: Number(product.price),
    collection: product.collections?.name ?? "elara.",
    image: primaryImage?.alt_text ?? `${product.name} styled for elara.`,
    imageUrl: primaryImage?.image_url,
    imageAlt: primaryImage?.alt_text ?? product.name,
    images: galleryImages.map((image) => ({
      id: image.id,
      imageUrl: image.image_url,
      altText: image.alt_text ?? product.name,
      isPrimary: Boolean(image.is_primary),
      sortOrder: image.sort_order,
    })),
    stock: product.stock_quantity,
    lowStockThreshold: product.low_stock_threshold ?? 3,
    finishType,
    finishNotes: product.finish_notes ?? null,
    isSizeCustomizable: Boolean(product.is_size_customizable),
    sizeLengthBehavior,
    sizeOptions: product.size_options ?? [],
    sizeLabel: product.size_label,
    customLengthLabel: product.custom_length_label,
    customLengthHelpText: product.custom_length_help_text,
    fixedSizeNote: product.fixed_size_note,
    builderPriceTier: product.builder_price_tier ?? "basic",
    tags: product.product_tags?.map((tag) => tag.tag) ?? [],
    isFeatured: Boolean(product.is_featured),
    isNewArrival: Boolean(product.is_new_arrival),
    productType: product.product_type,
    materialDetails:
      getMaterialNote(finishType) ??
      product.material_details ??
      "Details will be confirmed before your order request.",
    careInstructions:
      getMaterialCareInstruction(finishType) ??
      product.care_instructions ??
      "Keep dry and store softly after wear.",
  };
}

async function fetchCollections(
  queryName: string,
  options: { activeOnly?: boolean; slug?: string } = {},
) {
  const supabase = getSupabasePublicServerClient();

  if (!supabase) {
    warnFallback(queryName);
    return null;
  }

  let query = supabase
    .from("collections")
    .select("name, slug, description, image_url, image_alt_text")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (options.activeOnly) {
    query = query.eq("is_active", true);
  }

  if (options.slug) {
    query = query.eq("slug", options.slug);
  }

  const { data, error } = await query;

  if (error || !data) {
    warnConfiguredQuery(queryName);
    return null;
  }

  return data.map(mapCollection);
}

async function fetchProducts(
  queryName: string,
  options: {
    activeOnly?: boolean;
    featuredOnly?: boolean;
    newArrivalOnly?: boolean;
    collectionSlug?: string;
    slug?: string;
    productTypes?: CatalogProduct["productType"][];
    inStockOnly?: boolean;
  } = {},
) {
  const supabase = getSupabasePublicServerClient();

  if (!supabase) {
    return null;
  }

  const collectionSelect = options.collectionSlug
    ? "collections!inner(name, slug)"
    : "collections(name, slug)";

  let query = supabase
    .from("products")
    .select(
      `
        id,
        name,
        slug,
        description,
        price,
        product_type,
        material_details,
        care_instructions,
        finish_type,
        finish_notes,
        is_size_customizable,
        size_length_behavior,
        size_options,
        size_label,
        custom_length_label,
        custom_length_help_text,
        fixed_size_note,
        builder_price_tier,
        stock_quantity,
        low_stock_threshold,
        is_featured,
        is_new_arrival,
        ${collectionSelect},
        product_images(id, image_url, alt_text, is_primary, sort_order),
        product_tags(tag)
      `,
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (options.activeOnly) {
    query = query.eq("is_active", true);
  }

  if (options.inStockOnly) {
    query = query.gt("stock_quantity", 0);
  }

  if (options.featuredOnly) {
    query = query.eq("is_featured", true);
  }

  if (options.newArrivalOnly) {
    query = query.eq("is_new_arrival", true);
  }

  if (options.collectionSlug) {
    query = query.eq("collections.slug", options.collectionSlug);
  }

  if (options.slug) {
    query = query.eq("slug", options.slug);
  }

  if (options.productTypes?.length) {
    query = query.in("product_type", options.productTypes);
  }

  const { data, error } = await query;

  if (error || !data) {
    warnConfiguredQuery(queryName);
    return null;
  }

  return (data as ProductWithRelations[]).map(mapProduct);
}

async function fetchProductSalesCounts(productIds: string[]) {
  const supabase = getSupabasePublicServerClient();

  if (!supabase || productIds.length === 0) {
    return new Map<string, number>();
  }

  const { data, error } = await supabase
    .from("order_items")
    .select("product_id, quantity, orders!inner(status)")
    .in("product_id", productIds)
    .in("orders.status", bestSellerStatuses);

  if (error || !data) {
    return new Map<string, number>();
  }

  const counts = new Map<string, number>();

  (
    data as {
      product_id: string | null;
      quantity: number | null;
    }[]
  ).forEach((row) => {
    if (!row.product_id) return;

    counts.set(
      row.product_id,
      (counts.get(row.product_id) ?? 0) + (row.quantity ?? 0),
    );
  });

  return counts;
}

async function sortReadyToShopProducts(products: CatalogProduct[]) {
  const salesCounts = await fetchProductSalesCounts(
    products.map((product) => product.id),
  );

  return products
    .map((product, index) => ({ product, index }))
    .sort((left, right) => {
      const leftInStock = left.product.stock > 0 ? 1 : 0;
      const rightInStock = right.product.stock > 0 ? 1 : 0;

      if (leftInStock !== rightInStock) {
        return rightInStock - leftInStock;
      }

      const leftSales = salesCounts.get(left.product.id) ?? 0;
      const rightSales = salesCounts.get(right.product.id) ?? 0;

      if (leftSales !== rightSales) {
        return rightSales - leftSales;
      }

      return left.index - right.index;
    })
    .map(({ product }) => product);
}

export async function getCollections() {
  const collections = await fetchCollections("getCollections");

  return collections ?? [];
}

export async function getActiveCollections() {
  const collections = await fetchCollections("getActiveCollections", {
    activeOnly: true,
  });

  return collections ?? [];
}

export async function getCollectionBySlug(slug: string) {
  const collections = await fetchCollections("getCollectionBySlug", {
    activeOnly: true,
    slug,
  });

  if (collections) {
    return collections[0] ?? null;
  }

  return null;
}

export async function getProducts() {
  const products = await fetchProducts("getProducts");

  return products ?? [];
}

export async function getActiveProducts() {
  const products = await fetchProducts("getActiveProducts", {
    activeOnly: true,
    inStockOnly: true,
  });

  return products ?? [];
}

export async function getReadyToShopProducts() {
  const products = await fetchProducts("getReadyToShopProducts", {
    activeOnly: true,
    productTypes: readyToShopProductTypes,
  });

  return products ? sortReadyToShopProducts(products) : [];
}

export async function getFeaturedProducts() {
  const products = await fetchProducts("getFeaturedProducts", {
    activeOnly: true,
    featuredOnly: true,
    inStockOnly: true,
  });

  return products ?? [];
}

export async function getNewArrivalProducts() {
  const products = await fetchProducts("getNewArrivalProducts", {
    activeOnly: true,
    newArrivalOnly: true,
    inStockOnly: true,
  });

  return products ?? [];
}

export async function getProductsByCollectionSlug(slug: string) {
  if (slug === "new-arrivals") {
    return getNewArrivalProducts();
  }

  return (
    (await fetchProducts("getProductsByCollectionSlug", {
      activeOnly: true,
      inStockOnly: true,
      collectionSlug: slug,
    })) ?? []
  );
}

export async function getProductBySlug(slug: string) {
  const products = await fetchProducts("getProductBySlug", {
    activeOnly: true,
    slug,
    inStockOnly: true,
  });

  if (products) {
    return products[0] ?? null;
  }

  return null;
}

export async function getBuilderChains() {
  const products = await fetchProducts("getBuilderChains", {
    activeOnly: true,
    inStockOnly: true,
    productTypes: ["chain"],
  });

  return products ?? [];
}

export async function getBuilderCharmsAndPendants() {
  const products = await fetchProducts("getBuilderCharmsAndPendants", {
    activeOnly: true,
    inStockOnly: true,
    productTypes: ["charm", "mini_charm", "pendant", "connector"],
  });

  return products ?? [];
}
