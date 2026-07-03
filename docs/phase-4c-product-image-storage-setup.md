# Phase 4C Product Image Storage Setup

Product image uploads use Supabase Storage.

## Bucket

Create a bucket named:

```text
product-images
```

For V1, use a public bucket because product images are public storefront assets.

## Suggested Folder Path

Uploaded product images use this path pattern:

```text
products/{product-id}/{filename}
```

## Safety Notes

- Do not upload secrets or private documents.
- Do not use a service role key in the frontend.
- Keep product image files limited to public storefront assets.

## Manual Policy Checklist

In Supabase Storage, confirm authenticated admin users can upload into the
`product-images` bucket.

For V1, the bucket can be public so storefront pages can display product images
directly from public URLs.

If uploads fail in the admin UI, confirm:

- The `product-images` bucket exists.
- The bucket accepts uploads from authenticated users.
- The current user has an active `admin_profiles` row.

## SQL Policies

Run these policies manually in the Supabase SQL Editor after the
`admin_profiles` migration exists. These policies are scoped to the
`product-images` bucket and only allow active admin profile users to write
product images.

If Supabase reports that a policy already exists, compare the existing policy
before replacing it. Duplicate policy errors can happen if this setup was run
previously.

```sql
create policy "Public can read product images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

create policy "Admins can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
  )
);

create policy "Admins can update product images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
  )
)
with check (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
  )
);

create policy "Admins can delete product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.is_active = true
  )
);
```

## Bucket Settings

In Supabase Storage, create or confirm a public bucket named
`product-images`. Product images are storefront assets, so public URLs are
expected for this phase. Do not upload private customer details, documents, or
secrets to this bucket.
