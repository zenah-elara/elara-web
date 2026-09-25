import { notFound } from "next/navigation";
import { ProductDetailExperience } from "@/components/product/product-detail-experience";
import {
  getActiveProducts,
  getProductBySlug,
} from "@/features/catalog/queries";

export async function generateStaticParams() {
  const products = await getActiveProducts();

  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailExperience product={product} />;
}
