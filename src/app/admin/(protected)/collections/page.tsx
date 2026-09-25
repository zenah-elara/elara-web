import Link from "next/link";
import { Button } from "@/components/button";
import {
  CollectionPublishControl,
  PublishAllCollectionsControl,
} from "@/components/admin/collection-publishing-controls";
import { SectionHeader } from "@/components/section-header";
import { getAdminCollections } from "@/features/admin/catalog/queries";

type CollectionsPageProps = {
  searchParams?: Promise<{ deleted?: string; message?: string }>;
};

export default async function AdminCollectionsPage({
  searchParams,
}: CollectionsPageProps) {
  const [collections, params] = await Promise.all([
    getAdminCollections(),
    searchParams,
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          eyebrow="Admin"
          title="Collections"
          description="Prepare collections in Draft, then publish them when they are ready for customers."
        />
        <div className="flex flex-wrap gap-3">
          <PublishAllCollectionsControl />
          <Button href="/admin/collections/new">Add Collection</Button>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {[
          ["Back to Admin", "/admin"],
          ["Add Collection", "/admin/collections/new"],
          ["Products", "/admin/products"],
          ["Orders", "/admin/orders"],
        ].map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-full border border-[#d8b36a] bg-[#fffdf8] px-4 py-2 text-sm font-semibold text-[#76504a]"
          >
            {label}
          </Link>
        ))}
      </div>

      {params?.message ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4 text-sm font-medium text-[#76504a]">
          <span>{params.message}</span>
          {params.message === "Collection saved." ? (
            <Link
              href="/admin/collections/new"
              className="rounded-full border border-[#d8b36a] bg-white px-4 py-2 text-xs font-semibold text-[#7A3F63]"
            >
              Add New Collection
            </Link>
          ) : null}
        </div>
      ) : null}
      {params?.deleted === "1" ? (
        <div className="mt-6 rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4 text-sm font-medium text-[#76504a]">
          Collection deleted.
        </div>
      ) : null}

      <div className="mt-8 overflow-x-auto rounded-3xl border border-[#efccd4] bg-white/82 shadow-sm">
        <div className="min-w-[780px]">
        <div className="grid grid-cols-[1.4fr_1fr_110px_120px_150px] gap-4 border-b border-[#efccd4] bg-[#fff7fa] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9d746d]">
          <span>Name</span>
          <span>Slug</span>
          <span>Status</span>
          <span>Sort</span>
          <span>Actions</span>
        </div>
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="grid grid-cols-[1.4fr_1fr_110px_120px_150px] items-center gap-4 border-b border-[#f5dce4] px-5 py-4 text-sm text-[#76504a] last:border-b-0"
          >
            <div>
              <p className="font-semibold text-cocoa">{collection.name}</p>
              <p className="mt-1 text-xs">
                {collection.created_at
                  ? new Date(collection.created_at).toLocaleDateString()
                  : "No date"}
              </p>
            </div>
            <span>{collection.slug}</span>
            <div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  collection.is_published
                    ? "bg-[#edf7ef] text-[#447451]"
                    : "bg-[#fff1f6] text-[#8f4f68]"
                }`}
              >
                {collection.is_published ? "Published" : "Draft"}
              </span>
              <p className="mt-1 text-xs text-[#8f5574]">
                {collection.is_published
                  ? "Visible to customers"
                  : "Hidden from customers"}
              </p>
              {collection.is_published && collection.published_at ? (
                <p className="mt-1 text-xs text-[#9d746d]">
                  Published {new Date(collection.published_at).toLocaleDateString()}
                </p>
              ) : null}
            </div>
            <span>{collection.sort_order ?? 0}</span>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/collections/${collection.id}/edit`}
                className="rounded-full border border-[#d8b36a] bg-[#fffdf8] px-3 py-1 text-xs font-semibold text-[#76504a]"
              >
                Edit
              </Link>
              <CollectionPublishControl
                collectionId={collection.id}
                isPublished={collection.is_published}
              />
            </div>
          </div>
        ))}
        {collections.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[#76504a]">
            No collections found.
          </div>
        ) : null}
        </div>
      </div>
    </section>
  );
}
