import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { SectionHeader } from "@/components/section-header";
import {
  getActiveCollections,
  getCollectionBySlug,
  getProductsByCollectionSlug,
} from "@/features/catalog/queries";

export async function generateStaticParams() {
  const collections = await getActiveCollections();

  return collections.map((collection) => ({ slug: collection.slug }));
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [collection, collectionProducts] = await Promise.all([
    getCollectionBySlug(slug),
    getProductsByCollectionSlug(slug),
  ]);

  if (!collection) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className={`overflow-hidden rounded-[2rem] bg-gradient-to-br ${collection.accent} shadow-sm`}>
        {collection.imageUrl ? (
          <div className="h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={collection.imageUrl}
              alt={collection.imageAlt ?? collection.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        <div className="p-8">
        <SectionHeader
          eyebrow="Collection"
          title={collection.name}
          description={`${collection.description} Browse the pieces in this drop, then add favorites to your order request.`}
        />
        </div>
      </div>
      <div className="mt-9 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-3xl boutique-card p-5">
          <p className="text-sm font-semibold text-cocoa">Drop notes</p>
          <div className="mt-4 space-y-4 text-sm text-[#76504a]">
            <div className="rounded-2xl bg-[#fff7fa] p-4">
              <p className="font-semibold text-[#9b6470]">Collection</p>
              <p className="mt-1">{collection.name}</p>
            </div>
            <div>
              <p className="font-semibold text-[#9b6470]">Style notes</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["gold", "soft pink", "custom", "giftable"].map((item) => (
                  <span key={item} className="rounded-full bg-[#fff1f6] px-3 py-1">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {collectionProducts.length > 0 ? (
            collectionProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="rounded-3xl boutique-card p-8 text-[#76504a] sm:col-span-2 xl:col-span-3">
              No products available in this collection yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
