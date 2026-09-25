-- elara. collection Draft / Published workflow
-- Collections default to Draft. Public catalog access is limited to published
-- collections and active products whose assigned collection is published.
-- Builder parts and active products without a collection keep their existing
-- public visibility behavior. Admin policies remain unchanged.

alter table public.collections
add column if not exists is_published boolean not null default false,
add column if not exists published_at timestamptz null;

create index if not exists collections_is_published_idx
on public.collections(is_published);

drop policy if exists "Public can read active collections" on public.collections;
create policy "Public can read published collections"
on public.collections
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read visible products"
on public.products
for select
to anon, authenticated
using (
  is_active = true
  and (
    product_type in ('chain', 'charm', 'mini_charm', 'connector', 'pendant')
    or collection_id is null
    or exists (
      select 1
      from public.collections
      where collections.id = products.collection_id
        and collections.is_published = true
    )
  )
);

drop policy if exists "Public can read images for active products" on public.product_images;
create policy "Public can read images for visible products"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.is_active = true
      and (
        products.product_type in ('chain', 'charm', 'mini_charm', 'connector', 'pendant')
        or products.collection_id is null
        or exists (
          select 1
          from public.collections
          where collections.id = products.collection_id
            and collections.is_published = true
        )
      )
  )
);

drop policy if exists "Public can read tags for active products" on public.product_tags;
create policy "Public can read tags for visible products"
on public.product_tags
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_tags.product_id
      and products.is_active = true
      and (
        products.product_type in ('chain', 'charm', 'mini_charm', 'connector', 'pendant')
        or products.collection_id is null
        or exists (
          select 1
          from public.collections
          where collections.id = products.collection_id
            and collections.is_published = true
        )
      )
  )
);

comment on column public.collections.is_published
is 'Draft when false and customer-visible when true. Managed by the Admin collection publishing workflow.';

comment on column public.collections.published_at
is 'The most recent time this collection was published. Null until first publication.';

comment on policy "Public can read published collections" on public.collections
is 'Storefront read-only policy. Draft collections remain private to Admin.';

comment on policy "Public can read visible products" on public.products
is 'Active shop products require a published collection when assigned. Builder parts and unassigned active products preserve existing visibility.';
