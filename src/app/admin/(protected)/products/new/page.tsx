import { SectionHeader } from "@/components/section-header";
import {
  ProductSetupFields,
  ProductSetupGuide,
} from "@/components/admin/product-setup-fields";
import { ProductSizeLengthFields } from "@/components/admin/product-size-length-fields";
import { createProduct } from "@/features/admin/catalog/actions";
import { getAdminCollections } from "@/features/admin/catalog/queries";

type NewProductPageProps = {
  searchParams?: Promise<{ message?: string }>;
};

export default async function NewProductPage({
  searchParams,
}: NewProductPageProps) {
  const [collections, params] = await Promise.all([
    getAdminCollections(),
    searchParams,
  ]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Admin"
        title="New product"
        description="Create a product, add tags, and optionally upload product images."
      />
      {params?.message ? (
        <div className="mt-6 rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4 text-sm font-medium text-[#76504a]">
          {params.message}
        </div>
      ) : null}
      <form action={createProduct} className="mt-8 space-y-6 rounded-3xl boutique-card p-6">
        <ProductSetupGuide />
        <div className="grid gap-5 md:grid-cols-2">
          <ProductBaseFields />
        </div>
        <ProductSetupFields collections={collections} />
        <ProductDetailFields />
        <MaterialDisclosureFields />
        <ProductSizeLengthFields />
        <ImageUploadFields />
        <button className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(201,130,149,0.22)]">
          Create product
        </button>
      </form>
    </section>
  );
}

function MaterialDisclosureFields() {
  return (
    <div className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-5">
      <p className="text-sm font-semibold text-cocoa">Material</p>
      <p className="mt-2 text-xs leading-5 text-[#76504a]">
        Choose the material customers should see for this product. Build Your
        Elara Piece can mix materials, such as a stainless steel chain with a
        gold-plated charm.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-[#efccd4] bg-white/75 px-4 py-3 text-sm font-semibold text-cocoa">
          <input name="finish_type" type="radio" value="gold_plated" defaultChecked />
          Gold-plated
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-[#efccd4] bg-white/75 px-4 py-3 text-sm font-semibold text-cocoa">
          <input name="finish_type" type="radio" value="stainless_steel" />
          Non-tarnish / Stainless steel
        </label>
      </div>
      <label className="mt-4 block">
        <span className="text-sm font-semibold text-cocoa">
          Optional material notes
        </span>
        <textarea
          name="finish_notes"
          rows={2}
          className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-cocoa outline-none"
        />
      </label>
    </div>
  );
}

function ProductBaseFields() {
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
      <label className="block md:col-span-2">
        <span className="text-sm font-semibold text-cocoa">Description</span>
        <textarea name="description" rows={4} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
    </>
  );
}

function ProductDetailFields() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Price</span>
        <input name="price" type="number" min="0" step="0.01" defaultValue="0" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">SKU</span>
        <input name="sku" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Sort order</span>
        <input name="sort_order" type="number" defaultValue="0" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Stock quantity</span>
        <input name="stock_quantity" type="number" min="0" defaultValue="0" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Low stock threshold</span>
        <input name="low_stock_threshold" type="number" min="0" defaultValue="3" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Tags</span>
        <input name="tags" placeholder="heart, gold, charm" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
      {["is_active", "is_featured", "is_new_arrival"].map((name) => (
        <label key={name} className="flex items-center gap-3 text-sm font-semibold text-cocoa">
          <input name={name} type="checkbox" defaultChecked={name === "is_active"} className="h-4 w-4" />
          {name.replace("is_", "").replace("_", " ")}
        </label>
      ))}
    </div>
  );
}

function ImageUploadFields() {
  return (
    <div className="grid gap-5 rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-5 md:grid-cols-2">
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Image uploads</span>
        <input name="images" type="file" accept="image/*" multiple className="mt-2 w-full text-sm text-[#76504a]" />
        <span className="mt-2 block text-xs font-medium text-[#8f4f68]">
          Upload JPG, PNG, or WebP images under 8 MB each.
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Image alt text</span>
        <input name="image_alt_text" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
      <label className="flex items-center gap-3 text-sm font-semibold text-cocoa">
        <input name="image_is_primary" type="checkbox" defaultChecked className="h-4 w-4" />
        Mark first uploaded image as primary
      </label>
    </div>
  );
}
