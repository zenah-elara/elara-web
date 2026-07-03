-- elara. Phase 4H follow-up: order_items insert schema and policies
-- This patch ensures public checkout can save order item rows and Build Your
-- Elara Piece details while keeping public access insert-only.

alter table public.order_items
alter column product_id drop not null;

alter table public.order_items
drop constraint if exists order_items_item_type_check,
add constraint order_items_item_type_check check (
  item_type in (
    'regular_product',
    'custom_necklace',
    'chain',
    'charm',
    'mini_charm',
    'pendant',
    'connector',
    'bracelet'
  )
);

grant insert on public.order_items to anon, authenticated;
grant insert on public.custom_necklace_items to anon, authenticated;
grant insert on public.custom_necklace_charms to anon, authenticated;
grant select on public.order_items to authenticated;
grant select on public.custom_necklace_items to authenticated;
grant select on public.custom_necklace_charms to authenticated;

drop policy if exists "Public can submit order request items" on public.order_items;
drop policy if exists "Public can submit custom necklace item details" on public.custom_necklace_items;
drop policy if exists "Public can submit custom necklace charm details" on public.custom_necklace_charms;
drop policy if exists "Active admins can read order items" on public.order_items;
drop policy if exists "Active admins can read custom necklace order items" on public.custom_necklace_items;
drop policy if exists "Active admins can read custom necklace charms" on public.custom_necklace_charms;

create policy "Public can submit order request items"
on public.order_items
for insert
to anon, authenticated
with check (
  order_id is not null
  and item_name is not null
  and unit_price >= 0
  and quantity > 0
  and line_total >= 0
  and (
    (item_type = 'regular_product' and product_id is not null)
    or (item_type = 'custom_necklace')
  )
);

create policy "Public can submit custom necklace item details"
on public.custom_necklace_items
for insert
to anon, authenticated
with check (
  order_item_id is not null
  and chain_product_id is not null
  and chain_name is not null
  and chain_price >= 0
);

create policy "Public can submit custom necklace charm details"
on public.custom_necklace_charms
for insert
to anon, authenticated
with check (
  custom_necklace_item_id is not null
  and charm_product_id is not null
  and charm_name is not null
  and charm_price >= 0
  and quantity > 0
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
is 'Public checkout can insert regular_product and custom_necklace item rows only. Regular products require product_id; custom necklace rows may leave product_id null.';
