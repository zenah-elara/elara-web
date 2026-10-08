# Storage image egress audit

## Findings

- Public product/collection cards, hero, collection banner, gallery, builder,
  cart, and Admin previews used plain img tags. CSS resized originals visually,
  but did not reduce their downloaded bytes. Gallery thumbnails fetched originals.
- No remote image optimizer configuration existed. There were no unoptimized
  overrides or image polling/cache-busting render loops in the inspected flow.
- Homepage fetched/rendered every New Arrival rather than at most four.
- Catalog listing queries returned all shared AND nested variant image rows.
  This expands JSON payloads, not Storage egress by itself. Cards already rendered
  one cover; they did not secretly download every gallery image.
- Uploads omitted cacheControl. Original uploads allow up to 8 MB for catalog
  images and 4 MB for homepage images; originals remain untouched by this patch.
- Existing replacements already used new timestamp paths and upsert:false. Paths
  now use UUIDs to avoid collisions and allow safe year-long caching.

These are code-level causes/opportunities, not measured attribution of production
traffic. No live Storage logs, object sizes, cache headers, or billing were accessed.
Cached Egress is bytes served by Supabase's CDN, not necessarily cache misses.

## Changes by file

| File | Change |
| --- | --- |
| next.config.ts | Allow only the known HTTPS Supabase public-object host; 1-day minimum optimized-image cache TTL. |
| src/app/page.tsx | Request at most four arrivals, defensive render cap, four-column image sizes. |
| src/features/catalog/queries.ts | Listings request one ordered shared cover and one cover per variant; detail queries retain full galleries; optional arrivals limit. Stock, tags, publication and filters unchanged. |
| src/components/product-card.tsx | Optimized single cover with responsive sizes and existing crop/hover. |
| src/components/collection-card.tsx | Optimized single cover using fill and responsive sizes. |
| src/components/hero-section.tsx | Optimized responsive fill image; only hero explicitly eager. |
| src/app/collections/[slug]/page.tsx | Optimized banner inside same 256px-height frame. |
| src/components/product/product-image-gallery.tsx | Optimized active image and small lazy thumbnails; full gallery only on detail/preview pages. |
| src/components/builder/necklace-builder.tsx | Optimized 56/64px previews only; no builder logic changes. |
| src/components/cart/cart-view.tsx | Optimized 96px preview only; no cart logic changes. |
| src/components/admin/homepage-image-form.tsx | New UUID path, cacheControl 31536000, no overwrite. |
| src/components/admin/collection-image-uploader.tsx | UUID path/cacheControl; optimize stored preview; local blob preview remains plain img. |
| src/components/admin/product-image-uploader.tsx | UUID path/cacheControl and optimized stored thumbnails. |
| src/components/admin/variant-image-uploader.tsx | UUID path/cacheControl and optimized stored thumbnails; local blob previews remain plain img. |
| src/features/admin/catalog/actions.ts | Server-side image upload UUID path/cacheControl; unchanged save behavior. |
| src/app/admin/(protected)/homepage/page.tsx | Optimize stored hero preview. |
| src/app/admin/(protected)/products/page.tsx | Optimize 56px listing thumbnail. |
| src/app/admin/(protected)/products/[productId]/edit/page.tsx | Optimize existing image previews; keep management unchanged. |
| src/app/admin/(protected)/orders/page.tsx | Optimize 44px preview only. |
| src/app/admin/(protected)/orders/[orderId]/page.tsx | Optimize 64px preview only. |
| tests/catalog-availability.test.mjs | Verify cover-only embedded limits, homepage limit, detail gallery preservation, existing stock/publication behavior. |
| docs/storage-image-egress-audit.md | Findings, changed-file inventory, deployment checks and limitations. |

## Manual actions and deployment checks

1. Deploy/restart Next.js so remotePatterns and optimizer configuration take effect.
   The configured host is public infrastructure, not a secret. If moving Supabase
   projects, update the allowlist. Existing non-Supabase external image URLs must
   be audited/explicitly allowed before deployment; do not use a wildcard host.
2. In DevTools Network (Disable cache OFF), verify image requests use /_next/image
   and requested widths match card/thumbnail sizes. Revisit a page and check cache
   reuse. Compare actual bytes with the original URLs, on desktop and mobile.
3. Confirm homepage has <=4 arrivals; collection/list covers match primary images,
   including products with only variant photos. Test no-primary sort_order fallback.
   Check nested PostgREST image limits against the live project; mocked tests do
   not substitute for live embedded query validation.
4. Open product detail, click every thumbnail/arrow, switch variants, and inspect
   portrait/landscape framing. Missing-image placeholders must remain intact.
5. Upload/replace homepage, collection, shared product and variant images. Confirm
   new distinct paths, cache-control max-age=31536000 on responses, saved previews
   and public display. Local file previews require no Storage download.
6. Existing object metadata/cache headers are NOT retroactively changed. Review
   old headers manually; if replacing/compressing old large images, upload to NEW
   paths and update references through Admin. Never overwrite year-cached URLs.
7. Next optimization still downloads the original on cold cache misses, sometimes
   once per requested size/format or cache region. It reduces repeat origin traffic
   and customer bytes, but cannot guarantee zero Supabase egress. If originals
   remain multi-MB, consider a separate reviewed upload-resizing/thumbnail pipeline
   or Supabase transformations (check plan support/cost) after measuring quality.
8. Monitor Vercel image-optimization usage as well as Supabase egress after deploy.
   Bots/scrapers/direct Storage hotlinks can still request originals; this patch
   does not change public bucket access. Inspect traffic origins if egress persists.

No schema, RLS, product records, original files, auth or purchasing logic changed.
Non-critical Next images default to lazy loading. No unoptimized override added.

References: [Next Image](https://nextjs.org/docs/app/api-reference/components/image),
[Supabase Storage optimizations](https://supabase.com/docs/guides/storage/production/scaling).

## Validation performed

- npm run lint, npm run typecheck, npm run build and git diff --check passed.
- Five catalog regression tests passed, including cover query limits/detail gallery
  preservation and existing sold-out/publication behavior.
- Local production-server browser check: homepage hero and collection cover loaded
  via /_next/image; below-fold images were lazy. Amora Heart Ring detail loaded
  its optimized shared image; selecting Clear displayed the two variant photos
  as optimized main/thumbnail sources. Thumbnail navigation switched the active
  image. No cart submission or live upload/data mutation was performed.
- Admin uploads, response cache headers, other viewports/products and production
  byte/egress changes still require the deployment checks above.
