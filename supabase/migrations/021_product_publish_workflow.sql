-- elara. product-level Draft / Published workflow.
-- Existing active products are backfilled as Published so the current live
-- catalog does not disappear. Existing inactive products remain Draft.
-- New products default to Draft. Product Active / Inactive remains separate.

alter table public.products
add column if not exists is_published boolean not null default false,
add column if not exists published_at timestamptz null;

update public.products
set
  is_published = true,
  published_at = coalesce(published_at, updated_at, created_at, now())
where is_active = true
  and is_published = false;

create index if not exists products_is_published_idx
on public.products(is_published);

drop policy if exists "Public can read visible products" on public.products;
create policy "Public can read visible products"
on public.products
for select
to anon, authenticated
using (
  is_active = true
  and (
    product_type in ('chain', 'charm', 'mini_charm', 'connector', 'pendant')
    or (
      is_published = true
      and (
        collection_id is null
        or exists (
          select 1 from public.collections
          where collections.id = products.collection_id
            and collections.is_published = true
        )
      )
    )
  )
);

drop policy if exists "Public can read images for visible products" on public.product_images;
create policy "Public can read images for visible products"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.is_active = true
      and (
        products.product_type in ('chain', 'charm', 'mini_charm', 'connector', 'pendant')
        or (
          products.is_published = true
          and (
            products.collection_id is null
            or exists (
              select 1 from public.collections
              where collections.id = products.collection_id
                and collections.is_published = true
            )
          )
        )
      )
  )
);

drop policy if exists "Public can read tags for visible products" on public.product_tags;
create policy "Public can read tags for visible products"
on public.product_tags
for select
to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_tags.product_id
      and products.is_active = true
      and (
        products.product_type in ('chain', 'charm', 'mini_charm', 'connector', 'pendant')
        or (
          products.is_published = true
          and (
            products.collection_id is null
            or exists (
              select 1 from public.collections
              where collections.id = products.collection_id
                and collections.is_published = true
            )
          )
        )
      )
  )
);

drop policy if exists "Public can read visible product variants" on public.product_variants;
create policy "Public can read visible product variants"
on public.product_variants
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from public.products
    where products.id = product_variants.product_id
      and products.is_active = true
      and (
        products.product_type in ('chain', 'charm', 'mini_charm', 'connector', 'pendant')
        or (
          products.is_published = true
          and (
            products.collection_id is null
            or exists (
              select 1 from public.collections
              where collections.id = products.collection_id
                and collections.is_published = true
            )
          )
        )
      )
  )
);

comment on column public.products.is_published
is 'Draft when false. Normal shop products are customer-visible only when Published, Active, and assigned to a Published collection when applicable.';

comment on column public.products.published_at
is 'The most recent time this product was published. Null until first publication.';

comment on policy "Public can read visible products" on public.products
is 'Normal shop products require Product Published + Active and a Published collection when assigned. Builder parts preserve active-product visibility.';
