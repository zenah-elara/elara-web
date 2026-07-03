import Link from "next/link";
import { Button } from "@/components/button";
import { ProductCard } from "@/components/product-card";
import { SectionHeader } from "@/components/section-header";
import { getReadyToShopProducts } from "@/features/catalog/queries";
import type { CatalogProduct } from "@/features/catalog/types";

type StyleProductType = "necklace" | "bracelet" | "ring";

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
];

type ShopProductsPageProps = {
  searchParams?: Promise<{
    style?: string;
    tag?: string;
    tags?: string;
  }>;
};

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

  return styleFilter.productTypes.includes(
    product.productType as StyleProductType,
  );
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

function makeShopProductsHref({
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

  return query ? `/shop-products?${query}` : "/shop-products";
}

export default async function ShopProductsPage({
  searchParams,
}: ShopProductsPageProps) {
  const query = await searchParams;
  const selectedStyle = query?.style ?? "";
  const selectedTags = getSelectedTags(query);
  const hasActiveFilters = Boolean(selectedStyle || selectedTags.length);
  const products = await getReadyToShopProducts();
  const availableStyleFilters = styleFilters.filter((filter) =>
    products.some((product) =>
      filter.productTypes.includes(
        product.productType as StyleProductType,
      ),
    ),
  );
  const availableTagFilters = [
    ...new Set(products.flatMap((product) => product.tags.map(normalizeTag))),
  ].sort();
  const visibleProducts = hasActiveFilters
    ? filterProducts(products, selectedStyle, selectedTags)
    : products;

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-[#efccd4] bg-[linear-gradient(135deg,#fff9f5_0%,#fde7ef_52%,#fff4df_100%)] p-7 shadow-[0_22px_54px_rgba(211,140,157,0.14)]">
        <SectionHeader
          eyebrow="Ready to shop"
          title="Shop Products"
          description="Browse ready-to-shop elara. pieces, from everyday jewelry to gift-worthy favorites."
        />
      </section>

      <section className="mt-9 grid gap-6 lg:grid-cols-[260px_1fr]">
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
                        href={makeShopProductsHref({
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
                    Add active shop products to enable style filters.
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
                        href={makeShopProductsHref({
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
                    Add tags to active shop products to enable tag filters.
                  </p>
                )}
              </div>
            </div>
            {hasActiveFilters ? (
              <Link
                href="/shop-products"
                className="inline-flex rounded-full border border-[#d8b36a] bg-[#fffdf8] px-4 py-2 text-xs font-semibold text-[#7A3F63] transition hover:bg-[#fff1f6]"
              >
                Clear filters
              </Link>
            ) : null}
          </div>
        </aside>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.length > 0 ? (
            visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : hasActiveFilters ? (
            <div className="rounded-3xl boutique-card p-8 text-sm font-semibold text-[#8f5574] sm:col-span-2 xl:col-span-3">
              <p>No pieces match these filters yet.</p>
              <p className="mt-2 font-medium">
                Try clearing filters or checking another style.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl boutique-card p-8 text-sm font-semibold text-[#8f5574] sm:col-span-2 xl:col-span-3">
              No products are available yet. Please check back soon.
            </div>
          )}
        </div>
      </section>

      <section className="mt-12 rounded-[2rem] border border-[#efccd4] bg-[linear-gradient(135deg,#fff7fa_0%,#ffe1ec_58%,#fff8e8_100%)] p-6 shadow-[0_20px_50px_rgba(211,140,157,0.14)] sm:p-8">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c6a15a]">
              Custom charm styling
            </p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-[#A55166] [font-family:Georgia,'Times_New_Roman',serif]">
              Build Your Elara Piece
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f3f52]">
              Create your own necklace by choosing a chain, main charm, mini
              charm, or connector. Pricing updates automatically based on your
              selected pieces.
            </p>
          </div>
          <Button href="/build-your-necklace">Start building</Button>
        </div>
      </section>
    </main>
  );
}
