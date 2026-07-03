import Link from "next/link";
import { Button } from "@/components/button";
import { SectionHeader } from "@/components/section-header";
import {
  deleteProduct,
  toggleProductActive,
} from "@/features/admin/catalog/actions";
import {
  getAdminCollections,
  getAdminProducts,
} from "@/features/admin/catalog/queries";
import { productTypes, type ProductType } from "@/features/admin/catalog/types";
import { formatPrice } from "@/lib/data";

type ProductsPageProps = {
  searchParams?: Promise<{
    message?: string;
    status?: "all" | "active" | "inactive";
    product_type?: ProductType | "all";
    collection_id?: string | "all";
    low_stock?: string;
  }>;
};

export default async function AdminProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const [collections, products] = await Promise.all([
    getAdminCollections(),
    getAdminProducts({
      status: params?.status ?? "all",
      productType: params?.product_type ?? "all",
      collectionId: params?.collection_id ?? "all",
      lowStock: params?.low_stock === "on",
    }),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          eyebrow="Admin"
          title="Products"
          description="Manage product details, stock, tags, and storefront visibility."
        />
        <Button href="/admin/products/new">Add Product</Button>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {[
          ["Back to Admin", "/admin"],
          ["Add Product", "/admin/products/new"],
          ["Collections", "/admin/collections"],
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
          {params.message === "Product saved." ? (
            <Link
              href="/admin/products/new"
              className="rounded-full border border-[#d8b36a] bg-white px-4 py-2 text-xs font-semibold text-[#7A3F63]"
            >
              Add New Product
            </Link>
          ) : null}
        </div>
      ) : null}

      <form className="mt-8 grid gap-3 rounded-3xl boutique-card p-5 md:grid-cols-5">
        <select name="status" defaultValue={params?.status ?? "all"} className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select name="product_type" defaultValue={params?.product_type ?? "all"} className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-3 py-2 text-sm">
          <option value="all">All product types</option>
          {productTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select name="collection_id" defaultValue={params?.collection_id ?? "all"} className="rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-3 py-2 text-sm">
          <option value="all">All collections</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>{collection.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-3 py-2 text-sm font-semibold text-cocoa">
          <input name="low_stock" type="checkbox" defaultChecked={params?.low_stock === "on"} />
          Low stock
        </label>
        <button className="rounded-full bg-[#d38aa0] px-4 py-2 text-sm font-semibold text-white">
          Apply filters
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-3xl border border-[#efccd4] bg-white/82 shadow-sm">
        <div className="min-w-[1040px]">
          <div className="grid grid-cols-[80px_1.2fr_130px_1fr_100px_90px_130px_210px] gap-4 border-b border-[#efccd4] bg-[#fff7fa] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9d746d]">
            <span>Image</span>
            <span>Name</span>
            <span>Type</span>
            <span>Collection</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {products.map((product) => {
            const primaryImage =
              product.product_images?.find((image) => image.is_primary) ??
              product.product_images?.[0];

            return (
              <div
                key={product.id}
                className="grid grid-cols-[80px_1.2fr_130px_1fr_100px_90px_130px_210px] items-center gap-4 border-b border-[#f5dce4] px-5 py-4 text-sm text-[#76504a] last:border-b-0"
              >
                <div className="h-14 w-14 overflow-hidden rounded-2xl bg-[#fff1f6]">
                  {primaryImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={primaryImage.image_url} alt={primaryImage.alt_text ?? product.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div>
                  <p className="font-semibold text-cocoa">{product.name}</p>
                  <p className="mt-1 text-xs">{product.slug}</p>
                  <p className="mt-1 text-xs">
                    {product.is_featured ? "Featured" : null}
                    {product.is_featured && product.is_new_arrival ? " / " : null}
                    {product.is_new_arrival ? "New arrival" : null}
                  </p>
                </div>
                <span>{product.product_type}</span>
                <span>{product.collections?.name ?? "Unassigned"}</span>
                <span>{formatPrice(Number(product.price))}</span>
                <span>{product.stock_quantity}</span>
                <span>{product.is_active ? "Active" : "Inactive"}</span>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/products/${product.id}/edit`} className="rounded-full border border-[#d8b36a] bg-[#fffdf8] px-3 py-1 text-xs font-semibold text-[#76504a]">
                    Edit product
                  </Link>
                  <form action={toggleProductActive.bind(null, product.id, !product.is_active)}>
                    <button className="rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-semibold text-rose">
                      {product.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                  <form action={deleteProduct.bind(null, product.id)}>
                    <button className="rounded-full bg-[#fff1f6] px-3 py-1 text-xs font-semibold text-rose">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
          {products.length === 0 ? (
            <div className="px-5 py-8 text-sm text-[#76504a]">
              No products match these filters.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
