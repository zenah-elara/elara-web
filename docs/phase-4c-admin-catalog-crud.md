# Phase 4C Admin Catalog CRUD

This phase adds protected admin management for collections and products.

## What Was Added

- Admin catalog RLS migration:
  - `supabase/migrations/004_admin_catalog_crud_policies.sql`
- Protected admin routes:
  - `/admin/collections`
  - `/admin/collections/new`
  - `/admin/collections/[collectionId]/edit`
  - `/admin/products`
  - `/admin/products/new`
  - `/admin/products/[productId]/edit`
- Admin collection actions:
  - create collection
  - update collection
  - activate/deactivate collection
- Admin product actions:
  - create product
  - update product
  - activate/deactivate product
  - upload product image
  - set primary product image
  - delete product image record
  - upsert product tags

## Required Manual Migration

Run this migration in Supabase SQL Editor:

```text
supabase/migrations/004_admin_catalog_crud_policies.sql
```

The migration lets active `admin_profiles` users manage catalog tables only:

- `collections`
- `products`
- `product_images`
- `product_tags`

It does not add public write policies and does not add order write policies.

## Required Storage Bucket Setup

Create a Supabase Storage bucket named:

```text
product-images
```

For V1, make it public because product images are public storefront assets.

See:

```text
docs/phase-4c-product-image-storage-setup.md
```

## Add A Collection

1. Sign in as an authorized admin.
2. Open `/admin/collections`.
3. Click **New collection**.
4. Enter name, slug, description, sort order, and active status.
5. Save.

If the slug is left blank, the app generates one from the name.

## Add A Product

1. Sign in as an authorized admin.
2. Open `/admin/products`.
3. Click **New product**.
4. Fill in product details, price, stock, product type, tags, and visibility.
5. Optionally upload an image.
6. Save.

## Image Upload Behavior

Images upload to Supabase Storage bucket `product-images`.

Stored path format:

```text
products/{product-id}/{filename}
```

After upload, the public URL is saved in `product_images`.

If the bucket is missing or storage policies are not ready, the admin UI shows a
safe message instead of exposing raw secrets.

## Inactive Records

Inactive collections and products remain visible to admins.

Public storefront reads are still limited by the public catalog policies:

- active collections only
- active products only
- product images/tags only when the related product is active

Mock fallback remains in place for storefront catalog queries.

## Manual Test Checklist

- Owner can open `/admin/collections`.
- Owner can create a collection.
- Owner can edit a collection.
- Owner can activate/deactivate a collection.
- Owner can open `/admin/products`.
- Owner can create a product.
- Owner can edit a product.
- Owner can upload an image if `product-images` exists.
- Active product appears on the storefront.
- Inactive product does not appear publicly.
- Logged-out user cannot access admin CRUD routes.

## Next Phase

Phase 4D: Cart and order request checkout submission.

Then Phase 4E: Build Your Necklace working logic.
