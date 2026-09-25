import { SectionHeader } from "@/components/section-header";
import { createCollection } from "@/features/admin/catalog/actions";

type NewCollectionPageProps = {
  searchParams?: Promise<{ message?: string }>;
};

export default async function NewCollectionPage({
  searchParams,
}: NewCollectionPageProps) {
  const params = await searchParams;

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Admin"
        title="New collection"
        description="Add a storefront collection. If slug is blank, it will be generated from the name."
      />
      {params?.message ? (
        <div className="mt-6 rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4 text-sm font-medium text-[#76504a]">
          {params.message}
        </div>
      ) : null}
      <form action={createCollection} className="mt-8 space-y-5 rounded-3xl boutique-card p-6">
        <CollectionFields />
        <button className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(201,130,149,0.22)]">
          Create collection
        </button>
      </form>
    </section>
  );
}

function CollectionFields() {
  return (
    <>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Name</span>
        <input name="name" required className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Slug</span>
        <input name="slug" placeholder="Auto-generated from name if blank" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Description</span>
        <textarea name="description" rows={4} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Sort order</span>
        <input name="sort_order" type="number" defaultValue={0} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
      <div className="grid gap-4 rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-5">
        <label className="block">
          <span className="text-sm font-semibold text-cocoa">
            Collection thumbnail image
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
            className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-cocoa outline-none"
          />
        </label>
      </div>
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
              defaultChecked
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
    </>
  );
}
