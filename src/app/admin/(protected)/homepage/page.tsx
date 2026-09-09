import Link from "next/link";
import { HomepageImageForm } from "@/components/admin/homepage-image-form";
import { SectionHeader } from "@/components/section-header";
import { getAdminSiteAssetByKey } from "@/features/admin/site-assets/queries";

type AdminHomepagePageProps = {
  searchParams?: Promise<{ message?: string }>;
};

export default async function AdminHomepagePage({
  searchParams,
}: AdminHomepagePageProps) {
  const [params, heroAsset] = await Promise.all([
    searchParams,
    getAdminSiteAssetByKey("homepage_hero"),
  ]);
  const heroImageUrl =
    typeof heroAsset?.image_url === "string" && heroAsset.image_url.trim()
      ? heroAsset.image_url.trim()
      : null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Admin"
        title="Homepage"
        description="Manage the customer-facing landing page hero image."
      />
      <div className="mt-5 flex flex-wrap gap-2">
        {[
          ["Back to Admin", "/admin"],
          ["View Store", "/"],
          ["Collections", "/admin/collections"],
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
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <HomepageImageForm
          existingImageUrl={heroImageUrl}
          title={heroAsset?.title}
          altText={heroAsset?.alt_text}
          initialMessage={params?.message}
        />
        <aside className="h-fit rounded-3xl border border-[#efccd4] bg-white/82 p-5 shadow-sm">
          <p className="text-sm font-semibold text-cocoa">Current preview</p>
          <div className="mt-4 overflow-hidden rounded-2xl bg-[#fff1f6]">
            {heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImageUrl}
                alt={heroAsset?.alt_text ?? "Homepage hero preview"}
                className="h-72 w-full object-cover"
              />
            ) : (
              <div className="flex h-72 items-center justify-center px-6 text-center text-sm font-semibold text-[#9A4F78]">
                No homepage hero image uploaded yet. The storefront will use
                the branded fallback visual.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
