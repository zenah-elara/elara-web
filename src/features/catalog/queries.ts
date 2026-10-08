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
import { getSellableProductStock, getSellableVariantStock } from "./availability";

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
const builderProductTypes: NonNullable<CatalogProduct["productType"]>[] = [
  "chain",
  "charm",
  "mini_charm",
  "connector",
  "pendant",
];

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

export function mapProduct(product: ProductWithRelations): CatalogProduct {
  const finishType = normalizeMaterialType(product.finish_type);
  const sizeLengthBehavior =
    product.size_length_behavior && product.size_length_behavior !== "none"
      ? product.size_length_behavior
      : product.is_size_customizable && product.size_options?.length
        ? "preset"
        : "none";
  const sortedImages = (product.product_images ?? [])
    .filter((image) => !image.variant_id)
    .sort(
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

  function getVariantImages(variantId: string, nestedImages: NonNullable<NonNullable<ProductWithRelations["product_variants"]>[number]["product_images"]>) {
    const explicitImages = (product.product_images ?? []).filter(
      (image) => image.variant_id === variantId,
    );
    const candidates = explicitImages.length > 0 ? explicitImages : nestedImages;
    const uniqueImages = [...new Map(
      candidates.map((image) => [image.id ?? image.image_url, image]),
    ).values()];

    return uniqueImages.sort((a, b) => {
      if (Boolean(a.is_primary) !== Boolean(b.is_primary)) {
        return a.is_primary ? -1 : 1;
      }
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  }

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
    stock: getSellableProductStock(product),
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
    hasVariants: Boolean(product.has_variants),
    variants: (product.product_variants ?? [])
      .filter((variant) => variant.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((variant) => ({
        id: variant.id,
        finish: variant.finish,
        color: variant.color,
        stock: getSellableVariantStock(product, variant),
        priceOverride:
          variant.price_override === null
            ? null
            : Number(variant.price_override),
        materialTypeOverride: variant.material_type_override,
        isActive: variant.is_active,
        sortOrder: variant.sort_order,
        images: getVariantImages(variant.id, variant.product_images ?? [])
          .map((image) => ({
            id: image.id,
            imageUrl: image.image_url,
            altText: image.alt_text ?? product.name,
            isPrimary: Boolean(image.is_primary),
            sortOrder: image.sort_order,
          })),
        sizeInventory: (variant.product_size_inventory ?? [])
          .map((row) => ({
            id: row.id,
            variantId: row.variant_id,
            sizeLabel: row.size_label,
            stock: row.stock_quantity,
          })),
      })),
    sizeInventory: (product.product_size_inventory ?? [])
      .filter((row) => !row.variant_id)
      .map((row) => ({
        id: row.id,
        variantId: null,
        sizeLabel: row.size_label,
        stock: row.stock_quantity,
      })),
  };
}

async function fetchCollections(
  queryName: string,
  options: { publishedOnly?: boolean; slug?: string } = {},
) {
  const supabase = getSupabasePublicServerClient();

  if (!supabase) {
    warnFallback(queryName);
    return null;
  }

  let query = supabase
    .from("collections")
    .select("name, slug, description, image_url, image_alt_text, is_published")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (options.publishedOnly) {
    query = query.eq("is_published", true);
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
    publishedOnly?: boolean;
    featuredOnly?: boolean;
    newArrivalOnly?: boolean;
    collectionSlug?: string;
    slug?: string;
    productTypes?: CatalogProduct["productType"][];
    inStockOnly?: boolean;
    publicVisibility?: boolean;
    includeGallery?: boolean;
    limit?: number;
  } = {},
) {
  const supabase = getSupabasePublicServerClient();

  if (!supabase) {
    return null;
  }

  const collectionSelect = options.collectionSlug
    ? "collections!inner(name, slug, is_published)"
    : "collections(name, slug, is_published)";

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
        has_variants,
        is_active,
        is_published,
        published_at,
        is_featured,
        is_new_arrival,
        ${collectionSelect},
        product_images(id, image_url, alt_text, is_primary, sort_order, variant_id),
        product_variants(id, finish, color, stock_quantity, price_override, material_type_override, is_active, sort_order, product_images(id, image_url, alt_text, is_primary, sort_order), product_size_inventory(id, variant_id, size_label, stock_quantity)),
        product_size_inventory(id, variant_id, size_label, stock_quantity),
        product_tags(tag)
      `,
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (!options.includeGallery) {
    // Listing cards need covers, not every shared and variant gallery image.
    query = query
      .is("product_images.variant_id", null)
      .order("is_primary", { referencedTable: "product_images", ascending: false })
      .order("sort_order", { referencedTable: "product_images", ascending: true })
      .order("id", { referencedTable: "product_images", ascending: true })
      .limit(1, { referencedTable: "product_images" })
      .order("is_primary", { referencedTable: "product_variants.product_images", ascending: false })
      .order("sort_order", { referencedTable: "product_variants.product_images", ascending: true })
      .order("id", { referencedTable: "product_variants.product_images", ascending: true })
      .limit(1, { referencedTable: "product_variants.product_images" });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.activeOnly) {
    query = query.eq("is_active", true);
  }
  if (options.publishedOnly) {
    query = query.eq("is_published", true);
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

  const products = data as ProductWithRelations[];
  const visibleProducts = options.publicVisibility
    ? products.filter(
        (product) =>
          Boolean(product.is_active) &&
          (
            (product.product_type !== undefined &&
              builderProductTypes.includes(product.product_type)) ||
            (
              product.is_published &&
              (product.collections === null || product.collections.is_published)
            )
          ),
      )
    : products;

  const mappedProducts = visibleProducts.map(mapProduct);

  return options.inStockOnly
    ? mappedProducts.filter((product) => product.stock > 0)
    : mappedProducts;
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
  const collections = await fetchCollections("getCollections", {
    publishedOnly: true,
  });

  return collections ?? [];
}

export async function getActiveCollections() {
  const collections = await fetchCollections("getActiveCollections", {
    publishedOnly: true,
  });

  return collections ?? [];
}

export async function getCollectionBySlug(slug: string) {
  const collections = await fetchCollections("getCollectionBySlug", {
    publishedOnly: true,
    slug,
  });

  if (collections) {
    return collections[0] ?? null;
  }

  return null;
}

export async function getProducts() {
  const products = await fetchProducts("getProducts", {
    activeOnly: true,
    publishedOnly: true,
    publicVisibility: true,
  });

  return products ?? [];
}

export async function getActiveProducts() {
  const products = await fetchProducts("getActiveProducts", {
    activeOnly: true,
    publishedOnly: true,
    publicVisibility: true,
  });

  return products ?? [];
}

export async function getReadyToShopProducts() {
  const products = await fetchProducts("getReadyToShopProducts", {
    activeOnly: true,
    publishedOnly: true,
    productTypes: readyToShopProductTypes,
    publicVisibility: true,
  });

  return products ? sortReadyToShopProducts(products) : [];
}

export async function getFeaturedProducts() {
  const products = await fetchProducts("getFeaturedProducts", {
    activeOnly: true,
    publishedOnly: true,
    featuredOnly: true,
    publicVisibility: true,
  });

  return products ?? [];
}

export async function getNewArrivalProducts(limit?: number) {
  const products = await fetchProducts("getNewArrivalProducts", {
    activeOnly: true,
    publishedOnly: true,
    newArrivalOnly: true,
    limit,
    publicVisibility: true,
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
      publishedOnly: true,
      collectionSlug: slug,
      publicVisibility: true,
    })) ?? []
  );
}

export async function getProductBySlug(slug: string) {
  const products = await fetchProducts("getProductBySlug", {
    includeGallery: true,
    activeOnly: true,
    publishedOnly: true,
    slug,
    publicVisibility: true,
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
