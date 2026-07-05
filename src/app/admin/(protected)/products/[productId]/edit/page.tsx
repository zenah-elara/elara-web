import { notFound } from "next/navigation";
import {
  ProductSetupFields,
  ProductSetupGuide,
} from "@/components/admin/product-setup-fields";
import { ProductSizeLengthFields } from "@/components/admin/product-size-length-fields";
import { SectionHeader } from "@/components/section-header";
import {
  deleteProductImage,
  deleteProduct,
  setPrimaryProductImage,
  updateProduct,
  uploadProductImageAction,
} from "@/features/admin/catalog/actions";
import {
  getAdminCollections,
  getAdminProductById,
} from "@/features/admin/catalog/queries";

type EditProductPageProps = {
  params: Promise<{ productId: string }>;
  searchParams?: Promise<{ message?: string }>;
};

export default async function EditProductPage({
  params,
  searchParams,
}: EditProductPageProps) {
  const [{ productId }, query] = await Promise.all([params, searchParams]);
  const [product, collections] = await Promise.all([
    getAdminProductById(productId),
    getAdminCollections(),
  ]);

  if (!product) {
    notFound();
  }

  const tagValue = product.product_tags?.map((tag) => tag.tag).join(", ") ?? "";
  const images = [...(product.product_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const selectedFinishType =
    product.finish_type === "stainless_steel" ||
    product.finish_type === "non_tarnish"
      ? "stainless_steel"
      : "gold_plated";

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Admin"
        title={`Edit ${product.name}`}
        description="Update product details, tags, images, and storefront visibility."
      />
      {query?.message ? (
        <div className="mt-6 rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4 text-sm font-medium text-[#76504a]">
          {query.message}
        </div>
      ) : null}

      <form action={updateProduct.bind(null, product.id)} className="mt-8 space-y-6 rounded-3xl boutique-card p-6">
        <ProductSetupGuide />
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">Name</span>
            <input name="name" required defaultValue={product.name} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">Slug</span>
            <input name="slug" required defaultValue={product.slug} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-cocoa">Description</span>
            <textarea name="description" rows={4} defaultValue={product.description ?? ""} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
          </label>
        </div>

        <ProductSetupFields
          collections={collections}
          defaultCollectionId={product.collection_id}
          defaultProductType={product.product_type}
          defaultBuilderPriceTier={product.builder_price_tier}
        />

        <div className="grid gap-5 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">Price</span>
            <input name="price" type="number" min="0" step="0.01" defaultValue={Number(product.price)} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">SKU</span>
            <input name="sku" defaultValue={product.sku ?? ""} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">Sort order</span>
            <input name="sort_order" type="number" defaultValue={product.sort_order ?? 0} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">Stock quantity</span>
            <input name="stock_quantity" type="number" min="0" defaultValue={product.stock_quantity} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">Low stock threshold</span>
            <input name="low_stock_threshold" type="number" min="0" defaultValue={product.low_stock_threshold} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">Tags</span>
            <input name="tags" defaultValue={tagValue} className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
          </label>
          <input
            type="hidden"
            name="material_details"
            value={product.material_details ?? ""}
          />
          <input
            type="hidden"
            name="care_instructions"
            value={product.care_instructions ?? ""}
          />
          <label className="flex items-center gap-3 text-sm font-semibold text-cocoa">
            <input name="is_active" type="checkbox" defaultChecked={Boolean(product.is_active)} className="h-4 w-4" />
            active
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold text-cocoa">
            <input name="is_featured" type="checkbox" defaultChecked={Boolean(product.is_featured)} className="h-4 w-4" />
            featured
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold text-cocoa">
            <input name="is_new_arrival" type="checkbox" defaultChecked={Boolean(product.is_new_arrival)} className="h-4 w-4" />
            new arrival
          </label>
        </div>

        <div className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-5">
          <p className="text-sm font-semibold text-cocoa">
            Material
          </p>
          <p className="mt-2 text-xs leading-5 text-[#76504a]">
            Choose the material customers should see for this product. Build
            Your Elara Piece can mix materials, such as a stainless steel chain
            with a gold-plated charm.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-[#efccd4] bg-white/75 px-4 py-3 text-sm font-semibold text-cocoa">
              <input
                name="finish_type"
                type="radio"
                value="gold_plated"
                defaultChecked={selectedFinishType === "gold_plated"}
              />
              Gold-plated
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-[#efccd4] bg-white/75 px-4 py-3 text-sm font-semibold text-cocoa">
              <input
                name="finish_type"
                type="radio"
                value="stainless_steel"
                defaultChecked={selectedFinishType === "stainless_steel"}
              />
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
              defaultValue={product.finish_notes ?? ""}
              className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-cocoa outline-none"
            />
          </label>
        </div>

        <ProductSizeLengthFields
          defaultProductType={product.product_type}
          defaultBehavior={product.size_length_behavior}
          defaultIsSizeCustomizable={product.is_size_customizable}
          defaultSizeLabel={product.size_label}
          defaultSizeOptions={product.size_options}
          defaultFixedSizeNote={product.fixed_size_note}
          defaultCustomLengthLabel={product.custom_length_label}
          defaultCustomLengthHelpText={product.custom_length_help_text}
        />

        <div className="grid gap-5 rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">Upload more images</span>
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
            <input name="image_is_primary" type="checkbox" className="h-4 w-4" />
            Mark first uploaded image as primary
          </label>
        </div>

        <button className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(201,130,149,0.22)]">
          Save product
        </button>
      </form>

      <section className="mt-8 rounded-3xl boutique-card p-6">
        <h2 className="text-2xl font-semibold text-cocoa">Images</h2>
        <form action={uploadProductImageAction.bind(null, product.id)} className="mt-5 grid gap-4 rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-4 md:grid-cols-3">
          <label className="block text-sm text-[#76504a]">
            <input name="images" type="file" accept="image/*" multiple required className="w-full text-sm text-[#76504a]" />
            <span className="mt-2 block text-xs font-medium text-[#8f4f68]">
              Upload JPG, PNG, or WebP images under 8 MB each.
            </span>
          </label>
          <input name="image_alt_text" placeholder="Alt text" className="rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm" />
          <label className="flex items-center gap-3 text-sm font-semibold text-cocoa">
            <input name="image_is_primary" type="checkbox" className="h-4 w-4" />
            Make first primary
          </label>
          <button className="rounded-full bg-[#d38aa0] px-4 py-2 text-sm font-semibold text-white md:col-span-3">Upload images</button>
        </form>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="rounded-2xl border border-[#efccd4] bg-white/80 p-4">
              <div className="h-44 overflow-hidden rounded-2xl bg-[#fff1f6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.image_url} alt={image.alt_text ?? product.name} className="h-full w-full object-cover" />
              </div>
              <p className="mt-3 text-sm text-[#76504a]">{image.alt_text ?? "No alt text"}</p>
              <p className="mt-1 text-xs font-semibold text-gold">{image.is_primary ? "Primary" : "Secondary"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={setPrimaryProductImage.bind(null, product.id, image.id)}>
                  <button className="rounded-full border border-[#d8b36a] px-3 py-1 text-xs font-semibold text-[#76504a]">Set primary</button>
                </form>
                <form action={deleteProductImage.bind(null, product.id, image.id)}>
                  <button className="rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-semibold text-rose">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-[#efccd4] bg-white/82 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose">
          Product deletion
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[#7A3F63]">
          Delete product
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#76504a]">
          Deactivate is safer for products that may be part of order history.
          Hard delete removes this product when it is not attached to an order.
        </p>
        <form action={deleteProduct.bind(null, product.id)} className="mt-5">
          <button className="rounded-full bg-[#fff1f6] px-4 py-2 text-sm font-semibold text-rose transition hover:bg-[#ffe2ee]">
            Delete product permanently
          </button>
        </form>
      </section>
    </section>
  );
}
