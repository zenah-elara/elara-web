-- elara. Phase 4G homepage and collection image assets
-- Adds admin-managed storefront imagery while keeping public access read-only.

create table if not exists public.site_assets (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text,
  image_url text,
  alt_text text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger set_site_assets_updated_at
before update on public.site_assets
for each row
execute function public.set_updated_at();

alter table public.site_assets enable row level security;

alter table public.collections
add column if not exists image_url text,
add column if not exists image_alt_text text;

grant select on public.site_assets to anon, authenticated;
grant insert, update, delete on public.site_assets to authenticated;

create policy "Public can read active site assets"
on public.site_assets
for select
to anon, authenticated
using (is_active = true);

create policy "Active admins can manage site assets"
on public.site_assets
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

insert into storage.buckets (id, name, public)
values
  ('site-assets', 'site-assets', true),
  ('collection-images', 'collection-images', true)
on conflict (id) do update
set public = true;

drop policy if exists "Public can read site asset storage" on storage.objects;
drop policy if exists "Active admins can manage site asset storage" on storage.objects;
drop policy if exists "Public can read collection image storage" on storage.objects;
drop policy if exists "Active admins can manage collection image storage" on storage.objects;

create policy "Public can read site asset storage"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site-assets');

create policy "Active admins can manage site asset storage"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'site-assets'
  and exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
)
with check (
  bucket_id = 'site-assets'
  and exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
);

create policy "Public can read collection image storage"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'collection-images');

create policy "Active admins can manage collection image storage"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'collection-images'
  and exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
)
with check (
  bucket_id = 'collection-images'
  and exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
      and admin_profiles.role in ('owner', 'admin', 'staff')
  )
);

comment on table public.site_assets
is 'Admin-managed storefront image assets such as homepage_hero. Public users can read active assets only.';

comment on column public.collections.image_url
is 'Public collection thumbnail image URL managed by admins.';

comment on column public.collections.image_alt_text
is 'Alt text for the public collection thumbnail image.';
