# Phase 3C Public Read Policies

Phase 3C adds safe public read access for active storefront catalog data only. It does not add auth, admin CRUD, payment, order submission, or write access.

## Policies Added

Migration:

`supabase/migrations/002_public_catalog_read_policies.sql`

Policies:

- `collections`: `SELECT` for `anon` and `authenticated` when `is_active = true`
- `products`: `SELECT` for `anon` and `authenticated` when `is_active = true`
- `product_images`: `SELECT` for `anon` and `authenticated` only when the related product is active
- `product_tags`: `SELECT` for `anon` and `authenticated` only when the related product is active

No public insert, update, or delete policies were added.

## Tables That Remain Private

These tables intentionally do not receive public read policies:

- `orders`
- `order_items`
- `custom_necklace_items`
- `custom_necklace_charms`
- `inventory_movements`
- `admin_activity_logs`

Orders and admin data include private customer, workflow, stock, or operational information. They should remain private until protected admin/auth policies are designed.

## Why Only Active Catalog Data Is Public

The storefront should only show sellable, launch-ready catalog content. Inactive collections or products may be drafts, archived items, internal setup rows, or temporarily unavailable pieces. Limiting public reads to `is_active = true` keeps the public catalog clean while preserving admin flexibility later.

Product images and tags are only readable when their related product is active, so supporting metadata for hidden products is also hidden.

## Manual Migration Steps

1. Open the Supabase project for elara.
2. Open the Supabase SQL Editor.
3. Confirm `supabase/migrations/001_elara_v1_schema.sql` has already been applied.
4. Open local file `supabase/migrations/002_public_catalog_read_policies.sql`.
5. Copy the full SQL.
6. Paste it into the Supabase SQL Editor.
7. Review the SQL.
8. Run the SQL once.
9. Confirm there are no SQL errors.

Do not paste secrets into SQL Editor comments, terminal output, docs, screenshots, or chat.

## Verification Queries

Run these in the Supabase SQL Editor.

### Confirm Policies Exist

```sql
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('collections', 'products', 'product_images', 'product_tags')
order by tablename, policyname;
```

### Select Active Collections

```sql
select name, slug, is_active
from public.collections
where is_active = true
order by sort_order, name;
```

Expected result: the seeded active collections appear.

### Select Active Products

```sql
select name, slug, product_type, is_active
from public.products
where is_active = true
order by sort_order, name;
```

Expected result: active products appear after products are added. If no products have been added yet, this can return zero rows.

### Confirm Private Tables Have No Public Policies

```sql
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'orders',
    'order_items',
    'custom_necklace_items',
    'custom_necklace_charms',
    'inventory_movements',
    'admin_activity_logs'
  )
order by tablename, policyname;
```

Expected result: no public storefront policies for these private tables.

Conceptually, anon users should not be allowed to select from `orders` or related private tables. Do not add public read policies to make those tables visible.

### Confirm Inactive Products Do Not Appear Publicly

After creating a test inactive product in Supabase, this query should show whether inactive rows exist internally:

```sql
select name, slug, is_active
from public.products
where is_active = false
order by name;
```

The public storefront query should still filter to active products only:

```sql
select name, slug, is_active
from public.products
where is_active = true
order by name;
```

Expected result: inactive products are not part of public storefront reads.

## Expected Storefront Result

Once:

- migration `001` has been applied,
- migration `002` has been applied,
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured manually,
- and the app is restarted,

the storefront should read active collections/products from Supabase using the anon key.

If no live products exist yet, product pages and previews should continue to fall back gracefully to mock data. Admin status diagnostics should report Supabase configured and show readable collection counts.

## Next Step

After these policies are verified, move to Phase 4A: admin auth foundation and protected admin layout. Then Phase 4B can add admin collection/product CRUD with image upload.
