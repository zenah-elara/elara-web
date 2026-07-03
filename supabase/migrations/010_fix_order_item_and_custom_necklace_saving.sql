-- elara. Phase 4H checkout order item persistence repair
-- Keeps checkout write-only for public customers while ensuring order item and
-- Build Your Elara Piece rows can be inserted after an order request is created.

alter table public.order_items
alter column product_id drop not null;

grant insert on public.orders to anon, authenticated;
grant insert on public.order_items to anon, authenticated;
grant insert on public.custom_necklace_items to anon, authenticated;
grant insert on public.custom_necklace_charms to anon, authenticated;

grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.custom_necklace_items to authenticated;
grant select on public.custom_necklace_charms to authenticated;

drop policy if exists "Public can submit order requests" on public.orders;
drop policy if exists "Public can submit order request items" on public.order_items;
drop policy if exists "Public can submit custom necklace item details" on public.custom_necklace_items;
drop policy if exists "Public can submit custom necklace charm details" on public.custom_necklace_charms;
drop policy if exists "Active admins can read orders" on public.orders;
drop policy if exists "Active admins can read order items" on public.order_items;
drop policy if exists "Active admins can read custom necklace order items" on public.custom_necklace_items;
drop policy if exists "Active admins can read custom necklace charms" on public.custom_necklace_charms;

create policy "Public can submit order requests"
on public.orders
for insert
to anon, authenticated
with check (true);

create policy "Public can submit order request items"
on public.order_items
for insert
to anon, authenticated
with check (
  order_id is not null
  and item_type in (
    'regular_product',
    'custom_necklace',
    'chain',
    'charm',
    'mini_charm',
    'pendant',
    'connector',
    'bracelet'
  )
  and (
    item_type <> 'regular_product'
    or product_id is not null
  )
);

create policy "Public can submit custom necklace item details"
on public.custom_necklace_items
for insert
to anon, authenticated
with check (order_item_id is not null);

create policy "Public can submit custom necklace charm details"
on public.custom_necklace_charms
for insert
to anon, authenticated
with check (
  custom_necklace_item_id is not null
  and charm_product_id is not null
);

create policy "Active admins can read orders"
on public.orders
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
);

create policy "Active admins can read order items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
);

create policy "Active admins can read custom necklace order items"
on public.custom_necklace_items
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
);

create policy "Active admins can read custom necklace charms"
on public.custom_necklace_charms
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
);

comment on policy "Public can submit order request items"
on public.order_items
is 'Allows public checkout to insert item rows only. Regular products require product_id; custom necklace rows may use the chain product or null. No public read/update/delete is granted.';

comment on policy "Public can submit custom necklace item details"
on public.custom_necklace_items
is 'Allows public checkout to insert Build Your Elara Piece chain and length details only. No public read/update/delete is granted.';

comment on policy "Public can submit custom necklace charm details"
on public.custom_necklace_charms
is 'Allows public checkout to insert selected connector/charm/pendant/mini charm rows only. No public read/update/delete is granted.';
