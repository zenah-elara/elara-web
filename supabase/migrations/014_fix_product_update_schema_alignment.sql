-- elara. product update schema alignment
-- Safe patch for admin product updates after sizing/customization fields.
-- Adds missing product columns, refreshes constraints, and recreates the
-- active-admin product update policy. No public write access is granted.

alter table public.products
add column if not exists finish_type text,
add column if not exists finish_notes text,
add column if not exists is_size_customizable boolean not null default false,
add column if not exists size_options text[],
add column if not exists size_label text,
add column if not exists fixed_size_note text;

alter table public.order_items
add column if not exists selected_size text;

alter table public.products
drop constraint if exists products_product_type_check,
add constraint products_product_type_check check (
  product_type in (
    'regular_product',
    'necklace',
    'bracelet',
    'ring',
    'chain',
    'charm',
    'pendant',
    'mini_charm',
    'connector',
    'custom_necklace'
  )
);

alter table public.products
drop constraint if exists products_finish_type_check,
add constraint products_finish_type_check check (
  finish_type is null
  or finish_type in ('gold_plated', 'non_tarnish')
);

grant update on public.products to authenticated;

drop policy if exists "Active admins can update products" on public.products;

create policy "Active admins can update products"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
)
with check (
  exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
);

comment on column public.products.finish_type
is 'Optional customer-facing material disclosure: gold_plated or non_tarnish.';

comment on column public.products.finish_notes
is 'Optional additional customer-facing finish/care notes.';

comment on column public.products.is_size_customizable
is 'When true, customers can choose from size_options before adding this product to cart.';

comment on column public.products.size_options
is 'Available customer-facing sizes or lengths, such as ring sizes 5-9 or necklace lengths.';

comment on column public.products.size_label
is 'Customer-facing selector label, such as Ring size, Necklace length, Bracelet size, or Length.';

comment on column public.products.fixed_size_note
is 'Optional note shown when a product has fixed sizing and does not need customer selection.';

comment on column public.order_items.selected_size
is 'Selected size or length for regular product orders. Custom necklace chain length remains in custom_necklace_items.chain_length.';

comment on policy "Active admins can update products"
on public.products
is 'Admin catalog management policy. Active admin profile users can update products.';
