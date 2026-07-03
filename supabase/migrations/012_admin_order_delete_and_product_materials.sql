-- elara. Phase: admin order hard delete and product finish disclosures
-- Adds storefront material/finish disclosure fields and admin-only delete
-- policies for order cleanup. Public users are not granted delete access.

alter table public.products
add column if not exists finish_type text,
add column if not exists finish_notes text;

alter table public.products
drop constraint if exists products_finish_type_check,
add constraint products_finish_type_check check (
  finish_type is null
  or finish_type in ('gold_plated', 'non_tarnish')
);

comment on column public.products.finish_type
is 'Optional customer-facing material disclosure: gold_plated or non_tarnish.';

comment on column public.products.finish_notes
is 'Optional additional customer-facing finish/care notes.';

grant delete on public.orders to authenticated;
grant delete on public.order_items to authenticated;
grant delete on public.custom_necklace_items to authenticated;
grant delete on public.custom_necklace_charms to authenticated;

drop policy if exists "Active admins can delete orders" on public.orders;
drop policy if exists "Active admins can delete order items" on public.order_items;
drop policy if exists "Active admins can delete custom necklace order items" on public.custom_necklace_items;
drop policy if exists "Active admins can delete custom necklace charms" on public.custom_necklace_charms;

create policy "Active admins can delete orders"
on public.orders
for delete
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

create policy "Active admins can delete order items"
on public.order_items
for delete
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

create policy "Active admins can delete custom necklace order items"
on public.custom_necklace_items
for delete
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

create policy "Active admins can delete custom necklace charms"
on public.custom_necklace_charms
for delete
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

comment on policy "Active admins can delete orders"
on public.orders
is 'Admin cleanup policy. App blocks hard delete for stock-deducted non-cancelled orders.';

comment on policy "Active admins can delete order items"
on public.order_items
is 'Admin cleanup policy for deleting order child rows before hard-deleting an order.';

comment on policy "Active admins can delete custom necklace order items"
on public.custom_necklace_items
is 'Admin cleanup policy for deleting custom necklace rows before hard-deleting an order.';

comment on policy "Active admins can delete custom necklace charms"
on public.custom_necklace_charms
is 'Admin cleanup policy for deleting custom necklace charm rows before hard-deleting an order.';
