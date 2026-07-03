import { Button } from "@/components/button";
import { CollectionCard } from "@/components/collection-card";
import { HeroSection } from "@/components/hero-section";
import { ProductCard } from "@/components/product-card";
import { SectionHeader } from "@/components/section-header";
import {
  getActiveCollections,
  getNewArrivalProducts,
} from "@/features/catalog/queries";
import { getActiveSiteAssetByKey } from "@/features/site-assets/queries";

const instagramUrl =
  "https://www.instagram.com/elara.jewels.bcd?igsh=MTRoNTVjbDQyazltdw%3D%3D&utm_source=qr";
const facebookUrl = "https://www.facebook.com/elarajwels";

export default async function Home() {
  const [collections, newArrivals, homepageHero] = await Promise.all([
    getActiveCollections(),
    getNewArrivalProducts(),
    getActiveSiteAssetByKey("homepage_hero"),
  ]);
  const featuredCollections = collections.slice(0, 4);
  const orderSteps = [
    "Browse pieces",
    "Add favorites",
    "Send request",
    "Confirm by chat",
  ];
  const brandPromises = [
    {
      title: "Since 2020",
      copy: "elara. has stood by one promise: quality jewelry at accessible prices.",
    },
    {
      title: "Made for more women",
      copy: "We started after seeing how hard it was for women in Negros to find cute, affordable pieces that still felt worth wearing.",
    },
    {
      title: "Returning with intention",
      copy: "Now returning in 2026, elara. carries the same promise with more intention.",
    },
  ];
  const builderSteps = [
    {
      title: "Choose your chain",
      copy: "Pick the base that fits your look.",
    },
    {
      title: "Add your charms",
      copy: "Mix hearts, pearls, bows, gems, ocean pieces, and more.",
    },
    {
      title: "Review your piece",
      copy: "See your selected chain, charms, and estimated total.",
    },
    {
      title: "Send your order request",
      copy: "We'll contact you to confirm availability, payment, and delivery.",
    },
  ];

  return (
    <>
      <HeroSection
        heroImage={
          homepageHero?.image_url
            ? {
                imageUrl: homepageHero.image_url,
                altText: homepageHero.alt_text ?? "elara. jewelry hero image",
              }
            : null
        }
      />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.75rem] bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.88)_0,rgba(255,255,255,0.32)_28%,transparent_52%),radial-gradient(circle_at_85%_18%,rgba(251,230,238,0.85)_0,rgba(251,230,238,0.36)_26%,transparent_48%),linear-gradient(135deg,#fffdf8_0%,#fde7ef_48%,#fff9ef_100%)] p-7 shadow-[0_24px_70px_rgba(211,140,157,0.15)] sm:p-9">
          <div aria-hidden="true" className="absolute right-12 bottom-12 hidden text-3xl leading-none text-[#D38C9D]/45 md:block">♡</div>
          <div className="relative">
            <SectionHeader
              eyebrow="Brand promise"
              title="Our promise stayed the same."
              description="Since 2020, elara. has stood by one promise: quality jewelry at accessible prices. We started after seeing how hard it was for women in Negros to find cute, affordable pieces that still felt worth wearing. Over time, we were grateful to ship to women from different parts of the Philippines, expanding that purpose beyond where we began. Now returning in 2026, elara. carries the same promise with more intention: to make quality, expressive jewelry easier for every kind of woman to enjoy."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {brandPromises.map((promise) => (
                <div
                  key={promise.title}
                  className="rounded-[2rem] bg-white/74 p-6 shadow-[0_14px_34px_rgba(211,140,157,0.12)] backdrop-blur"
                >
                  <div className="mb-5 h-1.5 w-12 rounded-full bg-[#D38C9D]" />
                  <p className="text-lg font-semibold text-[#A55166]">
                    {promise.title}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#6f3f52]">
                    {promise.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Collections"
          title="Shop pieces for every version of you"
          description="Explore everyday staples, playful charms, dainty details, bold accents, and statement pieces selected with quality and wearability in mind."
        />
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredCollections.length > 0 ? (
            featuredCollections.map((collection) => (
              <CollectionCard key={collection.slug} collection={collection} />
            ))
          ) : (
            <div className="rounded-3xl boutique-card p-8 text-sm font-semibold text-[#8F4968] sm:col-span-2 lg:col-span-4">
              Collections are being updated. Please check back soon.
            </div>
          )}
        </div>
        <div className="mt-8 text-center">
          <Button href="/collections" variant="secondary">
            View all collections
          </Button>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_18%_10%,rgba(247,218,231,0.72)_0,rgba(247,218,231,0.22)_30%,transparent_54%),linear-gradient(180deg,#fff0f6_0%,#fffaf3_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="New arrivals"
            title="New pieces worth reaching for"
            description="Browse affordable jewelry picks with clear prices, stock notes, and details ready for your order request."
          />
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {newArrivals.length > 0 ? (
              newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="rounded-3xl boutique-card p-8 text-sm font-semibold text-[#8F4968] sm:col-span-2 lg:col-span-4">
                Products are being updated. Please check back soon.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="relative overflow-hidden rounded-[2.75rem] bg-[radial-gradient(circle_at_86%_15%,rgba(251,230,238,0.86)_0,rgba(251,230,238,0.28)_32%,transparent_54%),linear-gradient(145deg,#fffdf8,#ffeef5)] p-8 shadow-[0_22px_58px_rgba(211,140,157,0.14)]">
          <p className="inline-flex rounded-full border border-[#f2c8d5] bg-white/78 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#A55166]">
            Build Your Elara Piece
          </p>
          <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight text-[#A55166]">
            Create a piece that feels like you.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#6f3f52]">
            Choose your chain, pick your length, add your pendants or mini
            charms, and arrange them your way. Whether it&apos;s simple,
            playful, or statement-making, your piece is built around your style.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href="/build-your-necklace">Build Your Elara Piece</Button>
            <Button href="/checkout" variant="secondary">
              Submit order request
            </Button>
          </div>
        </div>
        <div className="relative grid gap-4 sm:grid-cols-2">
          {builderSteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-[2rem] bg-white/82 p-5 shadow-[0_12px_32px_rgba(211,140,157,0.1)]"
            >
              <p className="text-sm font-semibold text-[#D38C9D]">
                Step {index + 1}
              </p>
              <p className="mt-2 font-semibold text-[#A55166]">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#6f3f52]">
                {step.copy}
              </p>
              <div className="mt-5 h-16 rounded-2xl border border-white/75 bg-gradient-to-br from-[#ffd8e8] via-[#fff8f1] to-[#f7dba4]" />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative grid overflow-hidden gap-5 rounded-[2.75rem] bg-[radial-gradient(circle_at_12%_20%,rgba(255,255,255,0.78)_0,rgba(255,255,255,0.24)_30%,transparent_54%),linear-gradient(135deg,#ffe1ec,#fff8fb_48%,#fff2d9)] p-6 text-[#6f3f52] shadow-[0_20px_54px_rgba(211,140,157,0.14)] md:grid-cols-[1fr_1.15fr] md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D38C9D]">
              How ordering works
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-[#A55166]">
              No guessing, no pressure.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#6f3f52]">
              Since payment is not collected directly on the site yet, every
              order starts as a request. We&apos;ll personally confirm the details
              with you through your preferred contact method before anything is
              finalized.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {orderSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-white/75 bg-white/68 p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-[#D38C9D]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_78%_20%,rgba(251,230,238,0.82)_0,rgba(251,230,238,0.26)_28%,transparent_52%),linear-gradient(90deg,#fff7f9_0%,#fde7ef_50%,#fffaf3_100%)] text-[#6f3f52]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D38C9D]">
              Social orders
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-[#A55166]">
              Save a piece, send a message, make it yours.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open elara. on Instagram"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#f2c8d5] bg-[#fff9f5]/94 px-6 py-2 text-sm font-semibold text-[#8f4968] shadow-[0_10px_22px_rgba(211,140,157,0.14),inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition hover:-translate-y-0.5 hover:bg-[#FBE6EE] hover:text-[#A55166] focus-visible:ring-2 focus-visible:ring-[#D5A84F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff8fb]"
            >
              Instagram
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open elara. on Facebook"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#f2c8d5] bg-[#fff9f5]/94 px-6 py-2 text-sm font-semibold text-[#8f4968] shadow-[0_10px_22px_rgba(211,140,157,0.14),inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition hover:-translate-y-0.5 hover:bg-[#FBE6EE] hover:text-[#A55166] focus-visible:ring-2 focus-visible:ring-[#D5A84F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff8fb]"
            >
              Facebook
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
