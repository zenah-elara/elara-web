import { notFound } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { CollectionPublishControl } from "@/components/admin/collection-publishing-controls";
import { CollectionImageUploader } from "@/components/admin/collection-image-uploader";
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
        description="Update collection details and choose when customers can see it."
      />
      <div className="mt-5 flex flex-wrap gap-2">
        <CollectionPublishControl collectionId={collection.id} isPublished={collection.is_published} />
      </div>
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
        <fieldset className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-5">
          <legend className="px-1 text-sm font-semibold text-cocoa">
            Publishing
          </legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#efccd4] bg-white p-4">
              <input
                name="publication_status"
                type="radio"
                value="draft"
                defaultChecked={!collection.is_published}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="block text-sm font-semibold text-[#7A3F63]">Draft</span>
                <span className="mt-1 block text-xs leading-5 text-[#8f5574]">
                  Saved in Admin but hidden from customers.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#efccd4] bg-white p-4">
              <input
                name="publication_status"
                type="radio"
                value="published"
                defaultChecked={collection.is_published}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="block text-sm font-semibold text-[#7A3F63]">Published</span>
                <span className="mt-1 block text-xs leading-5 text-[#8f5574]">
                  Visible to customers.
                </span>
              </span>
            </label>
          </div>
        </fieldset>
        <button className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(201,130,149,0.22)]">
          Save collection
        </button>
      </form>
      <section className="mt-6 rounded-3xl boutique-card p-6">
        <h2 className="text-lg font-semibold text-[#7A3F63]">
          Collection thumbnail
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#8f5574]">
          Used as the main image for this collection across the storefront.
        </p>
        <CollectionImageUploader
          collectionId={collection.id}
          collectionName={collection.name}
          initialImageUrl={collection.image_url}
          initialAltText={collection.image_alt_text}
        />
      </section>
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
