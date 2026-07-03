-- elara. Phase 4D order request submission policies
-- Public customers may create order requests, but orders remain private.
-- Stock is intentionally not deducted when an order request is submitted.
-- Admin order workflow and stock deduction/restoration will be expanded later.

grant insert on public.orders to anon, authenticated;
grant insert on public.order_items to anon, authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;

create policy "Public can submit order requests"
on public.orders
for insert
to anon, authenticated
with check (true);

create policy "Public can submit order request items"
on public.order_items
for insert
to anon, authenticated
with check (true);

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

create policy "Active admins can update order workflow fields"
on public.orders
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

comment on policy "Public can submit order requests"
on public.orders
is 'Allows anon/authenticated storefront customers to insert order request rows only. No public select/update/delete is granted.';

comment on policy "Public can submit order request items"
on public.order_items
is 'Allows anon/authenticated storefront customers to insert order item rows only. No public select/update/delete is granted.';

comment on policy "Active admins can read orders"
on public.orders
is 'Active admin profile users can read private order requests in protected admin screens.';

comment on policy "Active admins can update order workflow fields"
on public.orders
is 'Active admin profile users can update order workflow notes/status later. Stock deduction is intentionally deferred.';

comment on policy "Active admins can read order items"
on public.order_items
is 'Active admin profile users can read private order items in protected admin screens.';
