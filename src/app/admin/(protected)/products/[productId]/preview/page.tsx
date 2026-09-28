import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailExperience } from "@/components/product/product-detail-experience";
import { ProductPublishControl } from "@/components/admin/product-publish-control";
import { getAdminProductById, getAdminProductPreview } from "@/features/admin/catalog/queries";
import { getAdminProductVisibility } from "@/features/admin/catalog/visibility";

export default async function AdminProductPreviewPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const [adminProduct, product] = await Promise.all([
    getAdminProductById(productId),
    getAdminProductPreview(productId),
  ]);
  if (!adminProduct || !product) notFound();

  const visibility = getAdminProductVisibility(adminProduct);
  const message = !adminProduct.is_active
    ? "Preview mode · This product is inactive and hidden from customers."
    : visibility.visible
      ? "Preview mode · This product is currently visible to customers."
      : adminProduct.is_published
        ? `Preview mode · This product is Published but hidden because ${visibility.reason}.`
        : "Preview mode · This product is Draft and hidden from customers.";

  return (
    <main>
      <section className="border-b border-[#efccd4] bg-[#fff5f8] px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#7A3F63]">{message}</p>
            <p className="mt-1 text-xs text-[#8f5574]">Preview shows the latest saved product state.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/products/${productId}/edit`} className="rounded-full border border-[#d8b36a] bg-white px-4 py-2 text-xs font-semibold text-[#7A3F63]">Back to Edit Product</Link>
            <Link href="/admin/products" className="rounded-full border border-[#efccd4] bg-white px-4 py-2 text-xs font-semibold text-[#7A3F63]">Back to Products</Link>
            {!adminProduct.is_published ? <ProductPublishControl productId={productId} isPublished={false} /> : null}
          </div>
        </div>
      </section>
      <ProductDetailExperience product={product} />
    </main>
  );
}
