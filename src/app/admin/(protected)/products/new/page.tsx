import { SectionHeader } from "@/components/section-header";
import {
  ProductSetupFields,
  ProductSetupGuide,
} from "@/components/admin/product-setup-fields";
import { ProductSizeLengthFields } from "@/components/admin/product-size-length-fields";
import { ProductVariantsFields } from "@/components/admin/product-variants-fields";
import {
  NonVariantOnly,
  VariantOnly,
} from "@/components/admin/product-variant-form-context";
import { ProductCreateForm } from "@/components/admin/product-create-form";
import { ProductMaterialFields } from "@/components/admin/product-material-fields";
import { ProductPublishingFields } from "@/components/admin/product-publishing-fields";
import { ProductStockField } from "@/components/admin/product-stock-field";
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
      <ProductCreateForm>
        <ProductSetupGuide />
        <div className="grid gap-5 md:grid-cols-2">
          <ProductBaseFields />
        </div>
        <ProductSetupFields collections={collections} />
        <ProductPublishingFields />
        <ProductVariantsFields />
        <ProductDetailFields />
        <ProductMaterialFields />
        <ProductSizeLengthFields />
        <NonVariantOnly>
          <p className="rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4 text-sm font-medium text-[#76504a]">
            Save the product first before uploading photos.
          </p>
        </NonVariantOnly>
        <VariantOnly>
          <details className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-5">
            <summary className="cursor-pointer text-sm font-semibold text-[#7A3F63]">Optional shared product photos</summary>
            <p className="mt-2 text-xs text-[#76504a]">Variant photos are added after the product and its combinations are saved.</p>
            <p className="mt-4 text-xs font-medium text-[#76504a]">Save the product first before uploading photos.</p>
          </details>
        </VariantOnly>
      </ProductCreateForm>
    </section>
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
        <VariantOnly><span className="mt-2 block text-xs font-normal text-[#76504a]">This price applies to all variants unless a specific variant has a different price.</span></VariantOnly>
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">SKU</span>
        <input name="sku" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
        <span className="mt-2 block text-xs font-normal text-[#76504a]">Optional internal product code, e.g. RING-001.</span>
      </label>
      <ProductStockField />
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Low stock threshold</span>
        <input name="low_stock_threshold" type="number" min="0" defaultValue="3" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-cocoa">Tags</span>
        <input name="tags" placeholder="heart, gold, charm" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none" />
      </label>
      <label className="flex items-start gap-3 text-sm font-semibold text-cocoa">
        <input name="is_active" type="checkbox" defaultChecked className="mt-1 h-4 w-4" />
        <span>Active<span className="mt-1 block text-xs font-normal text-[#76504a]">Currently enabled for sale. Inactive products remain hidden even when Published.</span></span>
      </label>
      {["is_featured", "is_new_arrival"].map((name) => (
        <label key={name} className="flex items-center gap-3 text-sm font-semibold text-cocoa">
          <input name={name} type="checkbox" defaultChecked={name === "is_active"} className="h-4 w-4" />
          {name.replace("is_", "").replace("_", " ")}
        </label>
      ))}
      <details className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] p-4 md:col-span-3">
        <summary className="cursor-pointer text-sm font-semibold text-[#7A3F63]">Advanced settings</summary>
        <label className="mt-4 block max-w-sm">
          <span className="text-sm font-semibold text-cocoa">Sort order</span>
          <input name="sort_order" type="number" step="1" defaultValue="0" className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-white px-4 py-3 text-sm text-cocoa outline-none" />
          <span className="mt-2 block text-xs leading-5 text-[#76504a]">Optional manual display priority. Lower numbers appear first where manual sorting is used.</span>
        </label>
      </details>
    </div>
  );
}
