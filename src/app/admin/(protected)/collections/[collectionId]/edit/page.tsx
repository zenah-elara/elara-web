import { notFound } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import {
  deleteCollection,
  updateCollection,
} from "@/features/admin/catalog/actions";
import { getAdminCollectionById } from "@/features/admin/catalog/queries";

type EditCollectionPageProps = {
  params: Promise<{ collectionId: string }>;
  searchParams?: Promise<{ message?: string }>;
};

export default async function EditCollectionPage({
  params,
  searchParams,
}: EditCollectionPageProps) {
  const [{ collectionId }, query] = await Promise.all([params, searchParams]);
  const collection = await getAdminCollectionById(collectionId);

  if (!collection) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Admin"
        title={`Edit ${collection.name}`}
        description="Update collection details and storefront visibility."
      />
      {query?.message ? (
        <div className="mt-6 rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4 text-sm font-medium text-[#76504a]">
          {query.message}
        </div>
      ) : null}
      <form
        action={updateCollection.bind(null, collection.id)}
        className="mt-8 space-y-5 rounded-3xl boutique-card p-6"
      >
        <label className="block">
          <span className="text-sm font-semibold text-cocoa">Name</span>
          <input name="name" required defaultValue={collection.name} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-cocoa">Slug</span>
          <input name="slug" required defaultValue={collection.slug} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-cocoa">Description</span>
          <textarea name="description" rows={4} defaultValue={collection.description ?? ""} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-cocoa">Sort order</span>
          <input name="sort_order" type="number" defaultValue={collection.sort_order ?? 0} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
        </label>
        <div className="grid gap-4 rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-5">
          <div>
            <p className="text-sm font-semibold text-cocoa">
              Current thumbnail
            </p>
            <div className="mt-3 overflow-hidden rounded-2xl bg-[#fff1f6]">
              {collection.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={collection.image_url}
                  alt={collection.image_alt_text ?? collection.name}
                  className="h-56 w-full object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center px-6 text-center text-sm font-semibold text-[#9A4F78]">
                  No collection thumbnail uploaded yet.
                </div>
              )}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">
              Replace thumbnail image
            </span>
            <input
              name="collection_image"
              type="file"
              accept="image/*"
              className="mt-2 w-full text-sm text-[#76504a]"
            />
            <span className="mt-2 block text-xs font-medium text-[#8f4f68]">
              Upload a JPG, PNG, or WebP image under 8 MB.
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">
              Image alt text
            </span>
            <input
              name="image_alt_text"
              defaultValue={collection.image_alt_text ?? ""}
              className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-cocoa outline-none"
            />
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold text-cocoa">
            <input
              name="clear_collection_image"
              type="checkbox"
              className="h-4 w-4"
            />
            Clear current thumbnail
          </label>
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold text-cocoa">
          <input name="is_active" type="checkbox" defaultChecked={Boolean(collection.is_active)} className="h-4 w-4" />
          Active
        </label>
        <button className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(201,130,149,0.22)]">
          Save collection
        </button>
      </form>
      <form
        action={deleteCollection.bind(null, collection.id)}
        className="mt-6 rounded-3xl border border-[#f0c9d6] bg-[#fff7fa] p-6"
      >
        <p className="text-sm font-semibold text-[#7A3F63]">
          Delete collection
        </p>
        <p className="mt-2 text-sm leading-6 text-[#8f5574]">
          This permanently deletes the collection. Products will not be deleted,
          but their collection link may be cleared or affected.
        </p>
        <label className="mt-4 flex items-start gap-3 text-sm font-semibold text-[#7A3F63]">
          <input
            name="confirm_delete_collection"
            type="checkbox"
            required
            className="mt-1 h-4 w-4"
          />
          I understand this permanently deletes the collection.
        </label>
        <button className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-[#d8b36a] bg-[#fffdf8] px-5 py-2 text-sm font-semibold text-[#7A3F63] shadow-sm transition hover:bg-[#fff1f6]">
          I understand, delete this collection
        </button>
      </form>
    </section>
  );
}
