import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { updateHomepageHero } from "@/features/admin/site-assets/actions";
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
      {params?.message ? (
        <div className="mt-6 rounded-2xl border border-[#efd2bc] bg-[#fff7ef] p-4 text-sm font-medium text-[#76504a]">
          {params.message}
        </div>
      ) : null}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <form
          action={updateHomepageHero}
          className="space-y-5 rounded-3xl boutique-card p-6"
        >
          <input
            type="hidden"
            name="existing_image_url"
            value={heroAsset?.image_url ?? ""}
          />
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">
              Title / label
            </span>
            <input
              name="title"
              defaultValue={heroAsset?.title ?? "Homepage hero"}
              className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">
              Hero image
            </span>
            <input
              name="image"
              type="file"
              accept="image/*"
              className="mt-2 w-full text-sm text-[#76504a]"
            />
            <span className="mt-2 block text-xs font-medium text-[#8f4f68]">
              Upload a JPG, PNG, or WebP image under 8 MB.
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-cocoa">Alt text</span>
            <input
              name="alt_text"
              defaultValue={heroAsset?.alt_text ?? ""}
              className="mt-2 w-full rounded-2xl border border-[#efccd4] bg-[#fffaf8] px-4 py-3 text-sm text-cocoa outline-none"
            />
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold text-cocoa">
            <input name="clear_image" type="checkbox" className="h-4 w-4" />
            Clear current image
          </label>
          <button className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d38aa0] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(201,130,149,0.22)]">
            Save homepage image
          </button>
        </form>
        <aside className="h-fit rounded-3xl border border-[#efccd4] bg-white/82 p-5 shadow-sm">
          <p className="text-sm font-semibold text-cocoa">Current preview</p>
          <div className="mt-4 overflow-hidden rounded-2xl bg-[#fff1f6]">
            {heroAsset?.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroAsset.image_url}
                alt={heroAsset.alt_text ?? "Homepage hero preview"}
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
