import Link from "next/link";
import { CollectionCard } from "@/components/collection-card";
import { ProductCard } from "@/components/product-card";
import { SectionHeader } from "@/components/section-header";
import {
  getActiveCollections,
  getActiveProducts,
} from "@/features/catalog/queries";
import type { CatalogProduct } from "@/features/catalog/types";

const tagFilters = [
  "heart",
  "pearl",
  "gold",
  "bow",
  "ocean",
  "gem",
  "dainty",
];

type StyleProductType =
  | "necklace"
  | "bracelet"
  | "ring";

const storefrontProductTypes = [
  "regular_product",
  "necklace",
  "bracelet",
  "ring",
] as const;

const styleFilters: {
  label: string;
  value: string;
  productTypes: StyleProductType[];
}[] = [
  {
    label: "necklaces",
    value: "necklaces",
    productTypes: ["necklace"],
  },
  {
    label: "bracelets",
    value: "bracelets",
    productTypes: ["bracelet"],
  },
  {
    label: "rings",
    value: "rings",
    productTypes: ["ring"],
  },
] as const;

type CollectionsPageProps = {
  searchParams?: Promise<{
    style?: string;
    tag?: string;
    tags?: string;
  }>;
};

function getProductType(product: CatalogProduct) {
  return product.productType ?? "regular_product";
}

function isStorefrontProduct(product: CatalogProduct) {
  return storefrontProductTypes.includes(
    getProductType(product) as (typeof storefrontProductTypes)[number],
  );
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

function getSelectedTags(query?: { tag?: string; tags?: string }) {
  const tags = [
    ...(query?.tags?.split(",") ?? []),
    ...(query?.tag ? [query.tag] : []),
  ]
    .map(normalizeTag)
    .filter(Boolean);

  return [...new Set(tags)];
}

function productMatchesStyle(product: CatalogProduct, style: string) {
  const styleFilter = styleFilters.find((filter) => filter.value === style);

  if (!styleFilter) {
    return !style;
  }

  return styleFilter.productTypes.includes(getProductType(product) as StyleProductType);
}

function productMatchesTags(product: CatalogProduct, tags: string[]) {
  if (tags.length === 0) {
    return true;
  }

  const productTags = product.tags.map(normalizeTag);

  return tags.every((tag) => productTags.includes(tag));
}

function filterProducts(
  products: CatalogProduct[],
  style: string,
  selectedTags: string[],
) {
  return products.filter(
    (product) =>
      productMatchesStyle(product, style) &&
      productMatchesTags(product, selectedTags),
  );
}

function makeCollectionsHref({
  style,
  tags,
}: {
  style?: string;
  tags?: string[];
}) {
  const params = new URLSearchParams();

  if (style) {
    params.set("style", style);
  }

  if (tags?.length) {
    params.set("tags", tags.join(","));
  }

  const query = params.toString();

  return query ? `/collections?${query}` : "/collections";
}

export default async function CollectionsPage({
  searchParams,
}: CollectionsPageProps) {
  const query = await searchParams;
  const selectedStyle = query?.style ?? "";
  const selectedTags = getSelectedTags(query);
  const hasActiveFilters = Boolean(selectedStyle || selectedTags.length);
  const [collections, activeProducts] = await Promise.all([
    getActiveCollections(),
    getActiveProducts(),
  ]);
  const storefrontProducts = activeProducts.filter(isStorefrontProduct);
  const availableStyleFilters = styleFilters.filter((filter) =>
    storefrontProducts.some((product) =>
      filter.productTypes.includes(getProductType(product) as StyleProductType),
    ),
  );
  const availableTagFilters = tagFilters.filter((tag) =>
    storefrontProducts.some((product) =>
      product.tags.map(normalizeTag).includes(tag),
    ),
  );
  const filteredProducts = hasActiveFilters
    ? filterProducts(storefrontProducts, selectedStyle, selectedTags)
    : [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] bg-gradient-to-br from-[#ffd8e8] via-[#fff7fa] to-[#fff4df] p-7 shadow-sm">
        <SectionHeader
          eyebrow="Collections"
          title="Browse the jewelry drops"
          description="Explore curated collections across everyday pieces, playful charms, dainty details, and statement stacks."
        />
      </div>
      <div className="mt-9 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-3xl boutique-card p-5">
          <p className="text-sm font-semibold text-cocoa">Quick filters</p>
          <div className="mt-4 space-y-5 text-sm text-[#76504a]">
            <div>
              <p className="font-semibold text-[#9b6470]">Style</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableStyleFilters.length > 0 ? (
                  availableStyleFilters.map((item) => {
                    const isActive = selectedStyle === item.value;

                    return (
                      <Link
                        key={item.value}
                        href={makeCollectionsHref({
                          style: isActive ? undefined : item.value,
                          tags: selectedTags,
                        })}
                        className={`rounded-full px-3 py-1 font-semibold transition ${
                          isActive
                            ? "bg-[#d38aa0] text-white"
                            : "bg-[#fff1f6] text-[#8f5574] hover:bg-[#ffe2ee]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-xs leading-5 text-[#8f5574]">
                    Add active products to enable style filters.
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className="font-semibold text-[#9b6470]">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableTagFilters.length > 0 ? (
                  availableTagFilters.map((item) => {
                    const isActive = selectedTags.includes(item);
                    const nextTags = isActive
                      ? selectedTags.filter((tag) => tag !== item)
                      : [...selectedTags, item];

                    return (
                      <Link
                        key={item}
                        href={makeCollectionsHref({
                          style: selectedStyle || undefined,
                          tags: nextTags,
                        })}
                        className={`rounded-full border px-3 py-1 font-semibold transition ${
                          isActive
                            ? "border-[#d38aa0] bg-[#d38aa0] text-white"
                            : "border-[#efccd4] bg-white/70 text-[#8f5574] hover:bg-[#fff1f6]"
                        }`}
                      >
                        {item}
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-xs leading-5 text-[#8f5574]">
                    Add product tags to enable tag filters.
                  </p>
                )}
              </div>
            </div>
            {hasActiveFilters ? (
              <Link
                href="/collections"
                className="inline-flex rounded-full border border-[#d8b36a] bg-[#fffdf8] px-4 py-2 text-xs font-semibold text-[#7A3F63] transition hover:bg-[#fff1f6]"
              >
                Clear filters
              </Link>
            ) : null}
          </div>
        </aside>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {hasActiveFilters && filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : hasActiveFilters ? (
            <div className="rounded-3xl boutique-card p-8 text-sm font-semibold text-[#8f5574] sm:col-span-2 xl:col-span-3">
              <p>No pieces match these filters yet.</p>
              <p className="mt-2 font-medium">
                Try clearing filters or checking another collection.
              </p>
            </div>
          ) : collections.length > 0 ? (
            collections.map((collection) => (
              <CollectionCard key={collection.slug} collection={collection} />
            ))
          ) : (
            <div className="rounded-3xl boutique-card p-8 text-sm font-semibold text-[#8f5574] sm:col-span-2 xl:col-span-3">
              No collections are available yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
