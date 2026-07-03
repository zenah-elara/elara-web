-- elara. Phase 3C public storefront read policies
-- These policies allow the public website to read active catalog data only.
-- Public users are not granted insert, update, or delete access.
-- Admin write policies are intentionally deferred until the auth/admin phase.
-- Orders, custom order records, inventory movements, and admin logs remain private.

create policy "Public can read active collections"
on public.collections
for select
to anon, authenticated
using (is_active = true);

create policy "Public can read active products"
on public.products
for select
to anon, authenticated
using (is_active = true);

create policy "Public can read images for active products"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.is_active = true
  )
);

create policy "Public can read tags for active products"
on public.product_tags
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_tags.product_id
      and products.is_active = true
  )
);

comment on policy "Public can read active collections"
on public.collections
is 'Storefront read-only policy. Public reads are limited to active collections.';

comment on policy "Public can read active products"
on public.products
is 'Storefront read-only policy. Public reads are limited to active products.';

comment on policy "Public can read images for active products"
on public.product_images
is 'Storefront read-only policy. Public image reads require an active related product.';

comment on policy "Public can read tags for active products"
on public.product_tags
is 'Storefront read-only policy. Public tag reads require an active related product.';
