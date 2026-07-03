-- elara. Phase 4C admin catalog CRUD policies
-- Active admin profile users can manage catalog tables only.
-- Public storefront read policies from migration 002 remain intact.
-- Orders, order items, inventory movements, and admin logs are intentionally
-- not granted write policies in this phase.

grant select, insert, update, delete on public.collections to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.product_images to authenticated;
grant select, insert, update, delete on public.product_tags to authenticated;

create policy "Active admins can select collections"
on public.collections
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

create policy "Active admins can insert collections"
on public.collections
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
);

create policy "Active admins can update collections"
on public.collections
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

create policy "Active admins can delete collections"
on public.collections
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

create policy "Active admins can select products"
on public.products
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

create policy "Active admins can insert products"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
);

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

create policy "Active admins can delete products"
on public.products
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

create policy "Active admins can manage product images"
on public.product_images
for all
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

create policy "Active admins can manage product tags"
on public.product_tags
for all
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

comment on policy "Active admins can select collections"
on public.collections
is 'Admin catalog management policy. Active admin profile users can read all collections for admin screens.';

comment on policy "Active admins can insert collections"
on public.collections
is 'Admin catalog management policy. Active admin profile users can create collections.';

comment on policy "Active admins can update collections"
on public.collections
is 'Admin catalog management policy. Active admin profile users can update collections.';

comment on policy "Active admins can delete collections"
on public.collections
is 'Admin catalog management policy. Prefer deactivation in the app when products are attached.';

comment on policy "Active admins can select products"
on public.products
is 'Admin catalog management policy. Active admin profile users can read all products for admin screens.';

comment on policy "Active admins can insert products"
on public.products
is 'Admin catalog management policy. Active admin profile users can create products.';

comment on policy "Active admins can update products"
on public.products
is 'Admin catalog management policy. Active admin profile users can update products.';

comment on policy "Active admins can delete products"
on public.products
is 'Admin catalog management policy. Prefer deactivation in the app to keep storefront history stable.';

comment on policy "Active admins can manage product images"
on public.product_images
is 'Admin catalog management policy. Active admin profile users can manage product image records.';

comment on policy "Active admins can manage product tags"
on public.product_tags
is 'Admin catalog management policy. Active admin profile users can manage product tag records.';
